import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';

@Injectable()
export class AzureAdService {
  private readonly logger = new Logger(AzureAdService.name);

  constructor(private configService: ConfigService) {}

  private async getMsalClient(tenantId: string, clientId: string, clientSecret: string) {
    const msalConfig = {
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret: clientSecret,
      },
    };
    return new ConfidentialClientApplication(msalConfig);
  }

  private async getAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
    try {
      this.logger.log('=== Azure AD Token Acquisition Start ===');
      this.logger.log(`Tenant ID: ${tenantId ? tenantId.substring(0, 8) + '...' : 'NOT SET'}`);
      this.logger.log(`Client ID: ${clientId ? clientId.substring(0, 8) + '...' : 'NOT SET'}`);
      this.logger.log(`Client Secret: ${clientSecret ? '***SET***' : 'NOT SET'}`);
      this.logger.log(`Authority URL: https://login.microsoftonline.com/${tenantId}`);
      
      const client = await this.getMsalClient(tenantId, clientId, clientSecret);
      
      this.logger.log('Requesting token with scope: https://graph.microsoft.com/.default');
      const result = await client.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default'],
      });

      if (!result?.accessToken) {
        this.logger.error('No access token in response');
        throw new Error('Failed to acquire access token');
      }

      this.logger.log('Successfully acquired Azure AD access token');
      this.logger.log(`Token expires at: ${result.expiresOn}`);
      this.logger.log(`Token length: ${result.accessToken.length} characters`);
      this.logger.log('=== Azure AD Token Acquisition End ===');
      
      return result.accessToken;
    } catch (error) {
      this.logger.error('=== Azure AD Token Acquisition Error ===');
      this.logger.error('Error Type:', error.constructor.name);
      this.logger.error('Error Message:', error.message);
      
      if (error.errorCode) {
        this.logger.error('Error Code:', error.errorCode);
      }
      
      if (error.errorMessage) {
        this.logger.error('Error Message from Azure:', error.errorMessage);
      }
      
      if (error.subError) {
        this.logger.error('Sub Error:', error.subError);
      }
      
      if (error.correlationId) {
        this.logger.error('Correlation ID:', error.correlationId);
      }
      
      // Log full error object for debugging
      this.logger.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      throw new BadRequestException('Failed to authenticate with Azure AD. Please check your credentials.');
    }
  }

  async fetchAzureUsers(tenantId: string, clientId: string, clientSecret: string) {
    try {
      this.logger.log('=== Azure AD User Fetch Start ===');
      const accessToken = await this.getAccessToken(tenantId, clientId, clientSecret);

      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      // Fetch users from Azure AD with relevant properties including manager
      const selectFields = 'id,displayName,givenName,surname,mail,userPrincipalName,department,jobTitle,officeLocation,mobilePhone,manager';
      const allUsers = [];
      let nextLink = null;
      let pageCount = 0;
      const pageSize = 100; // Use 100 as a safe page size
      
      this.logger.log('Calling Microsoft Graph API with pagination...');
      this.logger.log(`Select Fields: ${selectFields}`);
      this.logger.log('Expanding: manager');
      this.logger.log(`Page Size: ${pageSize}`);
      
      // Initial request
      let request = client
        .api('/users')
        .select(selectFields)
        .expand('manager($select=id,displayName,mail)')
        .top(pageSize);

      do {
        pageCount++;
        this.logger.log(`Fetching page ${pageCount}...`);
        
        let response;
        if (nextLink) {
          // Use the nextLink for subsequent requests
          response = await client.api(nextLink).get();
        } else {
          // First request
          response = await request.get();
        }

        if (response.value && response.value.length > 0) {
          allUsers.push(...response.value);
          this.logger.log(`Page ${pageCount}: Fetched ${response.value.length} users (Total: ${allUsers.length})`);
        }

        // Check for next page
        nextLink = response['@odata.nextLink'] || null;
        
        if (nextLink) {
          this.logger.log(`Next page available: ${nextLink}`);
        }

        // Safety limit to prevent infinite loops (max 50 pages = 5000 users)
        if (pageCount >= 50) {
          this.logger.warn('Reached maximum page limit (50 pages). Stopping pagination.');
          break;
        }
      } while (nextLink);

      this.logger.log('=== Microsoft Graph Response Summary ===');
      this.logger.log(`Total pages fetched: ${pageCount}`);
      this.logger.log(`Total users fetched: ${allUsers.length}`);
      
      // Log sample data from first user if available
      if (allUsers.length > 0) {
        this.logger.log('--- First User Sample ---');
        const firstUser = allUsers[0];
        this.logger.log(JSON.stringify({
          id: firstUser.id,
          displayName: firstUser.displayName,
          givenName: firstUser.givenName,
          surname: firstUser.surname,
          mail: firstUser.mail,
          userPrincipalName: firstUser.userPrincipalName,
          department: firstUser.department,
          jobTitle: firstUser.jobTitle,
          officeLocation: firstUser.officeLocation,
          mobilePhone: firstUser.mobilePhone,
          manager: firstUser.manager ? {
            id: firstUser.manager.id,
            displayName: firstUser.manager.displayName,
            mail: firstUser.manager.mail,
          } : null,
        }, null, 2));
      } else {
        this.logger.warn('No users returned from Azure AD');
      }
      
      this.logger.log('=== Azure AD User Fetch End ===');
      
      return allUsers.map((user: any) => ({
        id: user.id,
        displayName: user.displayName || '',
        firstName: user.givenName || user.displayName?.split(' ')[0] || '',
        lastName: user.surname || user.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.mail || user.userPrincipalName || '',
        userPrincipalName: user.userPrincipalName || '',
        department: user.department || 'General',
        jobTitle: user.jobTitle || 'Employee',
        officeLocation: user.officeLocation || '',
        mobilePhone: user.mobilePhone || '',
        manager: user.manager ? {
          id: user.manager.id,
          displayName: user.manager.displayName,
          mail: user.manager.mail,
        } : null,
      }));
    } catch (error) {
      this.logger.error('=== Azure AD User Fetch Error ===');
      this.logger.error('Error Type:', error.constructor.name);
      this.logger.error('Error Message:', error.message);
      
      if (error.statusCode) {
        this.logger.error('Status Code:', error.statusCode);
      }
      
      if (error.code) {
        this.logger.error('Error Code:', error.code);
      }
      
      if (error.body) {
        this.logger.error('Error Body:', JSON.stringify(error.body, null, 2));
      }
      
      if (error.response) {
        this.logger.error('Error Response:', JSON.stringify(error.response, null, 2));
      }
      
      // Check for specific Graph API errors
      if (error.message?.includes('Insufficient privileges')) {
        this.logger.error('PERMISSION ERROR: The Azure AD app needs User.Read.All or User.ReadBasic.All permission.');
        this.logger.error('Please add this permission in Azure Portal -> App Registrations -> API Permissions');
      }
      
      if (error.message?.includes('InvalidAuthenticationToken')) {
        this.logger.error('AUTHENTICATION ERROR: The access token is invalid or expired.');
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to fetch users from Azure AD. Please check your configuration.');
    }
  }

  async validateAzureCredentials(tenantId: string, clientId: string, clientSecret: string): Promise<boolean> {
    try {
      await this.getAccessToken(tenantId, clientId, clientSecret);
      return true;
    } catch (error) {
      return false;
    }
  }
}
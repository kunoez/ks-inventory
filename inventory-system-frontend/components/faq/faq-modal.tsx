"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  HelpCircle,
  Monitor,
  Users,
  Key,
  Phone,
  Cloud,
  Bell,
  MousePointer,
  Keyboard,
  Shield,
  Globe,
  Settings,
} from "lucide-react"

interface FAQModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FAQModal({ open, onOpenChange }: FAQModalProps) {
  const [activeTab, setActiveTab] = useState("devices")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            KOI Help & FAQ
          </DialogTitle>
          <DialogDescription>
            Comprehensive guide for using the Koch Inventory System
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="devices" className="text-xs">
              <Monitor className="h-3 w-3 mr-1" />
              Devices
            </TabsTrigger>
            <TabsTrigger value="employees" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="licenses" className="text-xs">
              <Key className="h-3 w-3 mr-1" />
              Licenses
            </TabsTrigger>
            <TabsTrigger value="phones" className="text-xs">
              <Phone className="h-3 w-3 mr-1" />
              Phones
            </TabsTrigger>
            <TabsTrigger value="azure" className="text-xs">
              <Cloud className="h-3 w-3 mr-1" />
              Azure
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs">
              <MousePointer className="h-3 w-3 mr-1" />
              Features
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="devices" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Device Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage company IT hardware assets including laptops, phones, and other devices.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-device">
                  <AccordionTrigger>How to Add a New Device</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Navigate to Devices page from the sidebar</li>
                      <li>Click the "Add Device" button</li>
                      <li>Fill in required fields:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li><strong>Name:</strong> Device identifier (e.g., "MacBook Pro 16")</li>
                          <li><strong>Type:</strong> laptop, desktop, phone, tablet, server, or other</li>
                          <li><strong>Manufacturer:</strong> Brand name (e.g., Apple, Dell, Samsung)</li>
                          <li><strong>Model:</strong> Specific model number</li>
                          <li><strong>Serial Number:</strong> Unique device serial (cannot be changed later)</li>
                        </ul>
                      </li>
                      <li>Optional: Add purchase date, warranty expiry, and notes</li>
                      <li>Click "Save" to create the device</li>
                    </ol>
                    <Badge variant="secondary">Tip: Serial numbers must be unique</Badge>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="edit-device">
                  <AccordionTrigger>Editing Device Information</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">To edit a device:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Find the device in the list</li>
                      <li>Click the edit icon in the Actions column</li>
                      <li>Update any fields except Serial Number and Company</li>
                      <li>Click "Save" to apply changes</li>
                    </ol>
                    <Badge variant="destructive">Note: Serial Number cannot be changed after creation</Badge>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="assign-device">
                  <AccordionTrigger>Assigning Devices to Employees</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Two methods to assign devices:</p>
                    <div className="space-y-2">
                      <div>
                        <strong className="text-sm">Method 1: Quick Assign</strong>
                        <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                          <li>In the device list, click the assign icon</li>
                          <li>Select an employee from the dropdown</li>
                          <li>Device status automatically changes to "Assigned"</li>
                        </ol>
                      </div>
                      <div>
                        <strong className="text-sm">Method 2: Drag and Drop</strong>
                        <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                          <li>Go to Devices page</li>
                          <li>Find an available device</li>
                          <li>Drag an employee card to the device</li>
                          <li>Assignment happens instantly</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="device-status">
                  <AccordionTrigger>Device Status Types</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ul className="space-y-2 text-sm">
                      <li><Badge className="mr-2">Available</Badge> Device is in inventory, ready for assignment</li>
                      <li><Badge variant="secondary" className="mr-2">Assigned</Badge> Currently assigned to an employee</li>
                      <li><Badge variant="outline" className="mr-2">Maintenance</Badge> Under repair or servicing</li>
                      <li><Badge variant="destructive" className="mr-2">Retired</Badge> No longer in use</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bulk-import">
                  <AccordionTrigger>Bulk Import Devices</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Import multiple devices at once:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Click "Bulk Import" button on Devices page</li>
                      <li>Download the CSV template</li>
                      <li>Fill in device data following the template format</li>
                      <li>Upload the completed CSV file</li>
                      <li>Review and confirm the import</li>
                    </ol>
                    <Badge variant="secondary">Format: Name, Type, Manufacturer, Model, Serial Number</Badge>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="employees" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Employee Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage employee records and their asset assignments.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-employee">
                  <AccordionTrigger>Adding New Employees</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Three ways to add employees:</p>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-sm">Manual Entry:</strong>
                        <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                          <li>Go to Employees page</li>
                          <li>Click "Add Employee"</li>
                          <li>Enter: First Name, Last Name, Email, Employee ID</li>
                          <li>Select Department and Position</li>
                          <li>Set Status (Active/Inactive)</li>
                        </ol>
                      </div>
                      <div>
                        <strong className="text-sm">Azure AD Sync:</strong>
                        <p className="text-sm ml-2">Import from Azure Active Directory (see Azure tab)</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="employee-assignments">
                  <AccordionTrigger>Viewing Employee Assignments</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">To see all assets assigned to an employee:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Click on the employee name or view icon</li>
                      <li>The detail view shows:
                        <ul className="list-disc list-inside ml-4">
                          <li>Assigned Devices</li>
                          <li>Software Licenses</li>
                          <li>Phone Contracts</li>
                          <li>Assignment History</li>
                        </ul>
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bulk-assign">
                  <AccordionTrigger>Bulk Assignment</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Assign multiple assets to an employee at once:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Select an employee</li>
                      <li>Click "Bulk Assign" button</li>
                      <li>Check devices, licenses, and phone contracts to assign</li>
                      <li>Click "Assign All" to complete</li>
                    </ol>
                    <Badge variant="secondary">Perfect for onboarding new employees</Badge>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="offboarding">
                  <AccordionTrigger>Employee Offboarding</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">When an employee leaves:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Go to employee detail page</li>
                      <li>Click "Return All Assets"</li>
                      <li>All devices, licenses, and phone contracts are unassigned</li>
                      <li>Set employee status to "Inactive"</li>
                    </ol>
                    <Badge variant="destructive">Important: Document returned equipment condition</Badge>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="licenses" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  License Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Track software licenses, subscriptions, and seat allocations.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-license">
                  <AccordionTrigger>Creating License Records</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Navigate to Licenses page</li>
                      <li>Click "Add License"</li>
                      <li>Enter license details:
                        <ul className="list-disc list-inside ml-4">
                          <li><strong>Name:</strong> Software name (e.g., "Microsoft 365")</li>
                          <li><strong>Vendor:</strong> Publisher (e.g., "Microsoft")</li>
                          <li><strong>Type:</strong> perpetual, subscription, trial, or open-source</li>
                          <li><strong>Max Users:</strong> Number of available seats</li>
                          <li><strong>Expiry Date:</strong> License end date</li>
                          <li><strong>License Key:</strong> Product key (encrypted storage)</li>
                        </ul>
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="license-assignment">
                  <AccordionTrigger>Assigning License Seats</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Two assignment methods:</p>
                    <div className="space-y-2">
                      <div>
                        <strong className="text-sm">Individual Assignment:</strong>
                        <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                          <li>Click assign icon next to license</li>
                          <li>Select employee(s)</li>
                          <li>Current users count updates automatically</li>
                        </ol>
                      </div>
                      <div>
                        <strong className="text-sm">Drag and Drop:</strong>
                        <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                          <li>Go to Licenses page</li>
                          <li>Find a license with available seats</li>
                          <li>Drag an employee card to the license to assign a seat</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="expiry-alerts">
                  <AccordionTrigger>License Expiry Alerts</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Automatic notifications for expiring licenses:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><Badge variant="destructive" className="mr-2">Critical</Badge> Expires in 7 days</li>
                      <li><Badge variant="secondary" className="mr-2">Warning</Badge> Expires in 30 days</li>
                      <li><Badge variant="outline" className="mr-2">Info</Badge> Expires in 90 days</li>
                    </ul>
                    <p className="text-sm mt-2">Notifications appear in:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Dashboard alerts section</li>
                      <li>Notification dropdown</li>
                      <li>Daily email digest (if enabled)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="license-types">
                  <AccordionTrigger>License Types Explained</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ul className="space-y-2 text-sm">
                      <li><strong>Perpetual:</strong> One-time purchase, no expiry</li>
                      <li><strong>Subscription:</strong> Recurring payment, has expiry date</li>
                      <li><strong>Trial:</strong> Temporary evaluation license</li>
                      <li><strong>Open-Source:</strong> Free/community licenses</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="phones" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Contract Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage mobile phone contracts and carrier services.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-contract">
                  <AccordionTrigger>Adding Phone Contracts</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Go to Phones page</li>
                      <li>Click "Add Contract"</li>
                      <li>Enter contract details:
                        <ul className="list-disc list-inside ml-4">
                          <li><strong>Phone Number:</strong> Include country code</li>
                          <li><strong>Carrier:</strong> Vodafone, Telekom, O2, or 1&1</li>
                          <li><strong>Plan Type:</strong> Prepaid or Contract</li>
                          <li><strong>Monthly Cost:</strong> In EUR</li>
                          <li><strong>Data Allowance:</strong> In GB</li>
                          <li><strong>Contract dates:</strong> Start and end dates</li>
                        </ul>
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="phone-assignment">
                  <AccordionTrigger>Phone Device Integration</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">When assigning a phone device:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>System automatically checks for available phone contracts</li>
                      <li>Option to assign both device and contract together</li>
                      <li>Contract status updates to "Active"</li>
                    </ol>
                    <Badge variant="secondary">Tip: Assign contract first, then the device</Badge>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="carriers">
                  <AccordionTrigger>German Carrier Information</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ul className="space-y-2 text-sm">
                      <li><strong>Vodafone:</strong> Business tariffs, international roaming</li>
                      <li><strong>Telekom:</strong> Best network coverage, premium plans</li>
                      <li><strong>O2:</strong> Cost-effective options, flexible contracts</li>
                      <li><strong>1&1:</strong> Budget-friendly, all-net flat rates</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="azure" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Azure AD Integration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sync employee data and authenticate with Azure Active Directory.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="azure-setup">
                  <AccordionTrigger>Initial Azure AD Setup</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Go to Settings → Azure AD</li>
                      <li>Enter your Azure credentials:
                        <ul className="list-disc list-inside ml-4">
                          <li>Tenant ID</li>
                          <li>Client ID</li>
                          <li>Client Secret</li>
                        </ul>
                      </li>
                      <li>Click "Test Connection"</li>
                      <li>Save configuration</li>
                    </ol>
                    <Badge variant="destructive">Admin privileges required</Badge>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sync-employees">
                  <AccordionTrigger>Syncing Employees from Azure</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Navigate to Employees page</li>
                      <li>Click "Sync from Azure AD"</li>
                      <li>Review the list of Azure users</li>
                      <li>Select users to import</li>
                      <li>Map Azure fields to employee fields</li>
                      <li>Click "Import Selected"</li>
                    </ol>
                    <p className="text-sm mt-2">Synced data includes:</p>
                    <ul className="list-disc list-inside text-sm">
                      <li>Name and email</li>
                      <li>Department and job title</li>
                      <li>Office location</li>
                      <li>Phone numbers</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sso">
                  <AccordionTrigger>Single Sign-On (SSO)</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Users can sign in with Microsoft:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Click "Sign in with Microsoft" on login page</li>
                      <li>Enter Azure AD credentials</li>
                      <li>Automatic account creation on first login</li>
                      <li>Role assignment based on Azure groups</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="auto-sync">
                  <AccordionTrigger>Automatic Sync Schedule</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Configure automatic synchronization:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Daily sync at specified time</li>
                      <li>Weekly sync on selected day</li>
                      <li>Monthly sync on specific date</li>
                      <li>Manual sync anytime</li>
                    </ul>
                    <Badge variant="secondary">Recommended: Daily sync at 2 AM</Badge>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications & Alerts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Stay informed about important system events and expirations.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="notification-types">
                  <AccordionTrigger>Notification Categories</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <ul className="space-y-2 text-sm">
                      <li><Badge className="mr-2">Device</Badge> New devices, assignments, maintenance</li>
                      <li><Badge className="mr-2">License</Badge> Expiry warnings, new licenses, seat availability</li>
                      <li><Badge className="mr-2">Employee</Badge> New hires, offboarding, profile updates</li>
                      <li><Badge className="mr-2">System</Badge> Updates, maintenance windows, errors</li>
                      <li><Badge className="mr-2">Assignment</Badge> Asset assignments and returns</li>
                      <li><Badge className="mr-2">Expiry</Badge> License and warranty expirations</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="manage-notifications">
                  <AccordionTrigger>Managing Notifications</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Notification actions:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Mark as Read:</strong> Click on individual notification</li>
                      <li><strong>Mark All as Read:</strong> Click checkmark icon in header</li>
                      <li><strong>Delete:</strong> Click X on notification</li>
                      <li><strong>Clear All:</strong> Click trash icon in header</li>
                      <li><strong>Filter:</strong> Use tabs for All/Unread views</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="notification-settings">
                  <AccordionTrigger>Notification Preferences</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Customize in Settings → Notifications:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Enable/disable categories</li>
                      <li>Set email digest frequency</li>
                      <li>Configure expiry warning days</li>
                      <li>Choose notification sound</li>
                      <li>Desktop notifications (requires permission)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="automated-alerts">
                  <AccordionTrigger>Automated Alerts</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">System automatically creates alerts for:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Licenses expiring in 30, 7, and 0 days</li>
                      <li>Warranty expiration warnings</li>
                      <li>Low license seat availability (&lt;10%)</li>
                      <li>Devices requiring maintenance</li>
                      <li>Contract renewals needed</li>
                    </ul>
                    <Badge variant="secondary">Daily check at 9:00 AM</Badge>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Advanced Features
                </h3>
                <p className="text-sm text-muted-foreground">
                  Power user features and upcoming functionality.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="drag-drop">
                  <AccordionTrigger>Drag & Drop Assignment</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Use drag & drop to quickly assign employees to assets:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Device Assignment:</strong> Drag an employee to an available device to assign it</li>
                      <li><strong>License Assignment:</strong> Drag an employee to a license to assign a seat</li>
                      <li><strong>Phone Contract Assignment:</strong> Drag an employee to a phone contract to assign it</li>
                    </ul>
                    <Badge variant="secondary">How to use: Navigate to the respective page (Devices, Licenses, or Phones), then drag employee cards to available items to assign them instantly</Badge>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bulk-operations">
                  <AccordionTrigger>Bulk Operations</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Perform actions on multiple items:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Select items using checkboxes</li>
                      <li>Choose bulk action from dropdown:
                        <ul className="list-disc list-inside ml-4">
                          <li>Assign to employee/department</li>
                          <li>Change status</li>
                          <li>Export to CSV</li>
                          <li>Delete selected</li>
                        </ul>
                      </li>
                      <li>Confirm action in dialog</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reporting">
                  <AccordionTrigger>Reports & Analytics</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Available reports:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Asset Summary:</strong> Complete inventory overview</li>
                      <li><strong>Assignment History:</strong> Who had what and when</li>
                      <li><strong>Cost Analysis:</strong> License and contract expenses</li>
                      <li><strong>Expiry Report:</strong> Upcoming expirations</li>
                      <li><strong>Utilization:</strong> Asset usage statistics</li>
                    </ul>
                    <p className="text-sm mt-2">Export formats: PDF, Excel, CSV</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="search-filter">
                  <AccordionTrigger>Search & Filtering</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Advanced search capabilities:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Global Search:</strong> Press Ctrl+K to search everything</li>
                      <li><strong>Column Filters:</strong> Click filter icon in table headers</li>
                      <li><strong>Quick Filters:</strong> Status badges are clickable</li>
                      <li><strong>Date Ranges:</strong> Filter by purchase/expiry dates</li>
                      <li><strong>Saved Filters:</strong> Save common filter combinations</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

          </ScrollArea>
        </Tabs>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <p className="text-sm">
              <strong>Support:</strong> For additional help, contact IT support at{" "}
              <a href="mailto:support@koch-solutions.de" className="underline">
                support@koch-solutions.de
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
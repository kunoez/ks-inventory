import { ApiProperty } from '@nestjs/swagger';

export class RecentActivityDto {
  @ApiProperty({ description: 'Unique identifier for the activity' })
  id: string;

  @ApiProperty({ enum: ['device', 'license', 'phone'], description: 'Type of assignment' })
  type: 'device' | 'license' | 'phone';

  @ApiProperty({ enum: ['assigned', 'returned', 'revoked'], description: 'Action taken' })
  action: 'assigned' | 'returned' | 'revoked';

  @ApiProperty({ enum: ['active', 'returned', 'revoked'], description: 'Current status' })
  status: 'active' | 'returned' | 'revoked';

  @ApiProperty({ description: 'Timestamp of the activity' })
  timestamp: Date;

  @ApiProperty({ description: 'Date when the item was assigned' })
  assignedDate: Date;

  @ApiProperty({ description: 'Date when the item was returned (if applicable)' })
  returnedDate?: Date;

  @ApiProperty({ description: 'Employee information' })
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };

  @ApiProperty({ description: 'Item information (device, license, or phone contract)' })
  item: {
    id: string;
    name: string;
    type?: string;
    manufacturer?: string;
    model?: string;
  };

  @ApiProperty({ description: 'User who performed the action' })
  actionBy: string;

  @ApiProperty({ description: 'Additional notes' })
  notes?: string;
}

export class RecentActivityResponseDto {
  @ApiProperty({ type: [RecentActivityDto], description: 'List of recent activities' })
  activities: RecentActivityDto[];

  @ApiProperty({ description: 'Total count of activities' })
  total: number;
}
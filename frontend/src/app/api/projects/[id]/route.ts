import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/services/prisma-data-service';
import { connectDB } from '@/lib/prisma';

// GET /api/projects/[id] - Get specific project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: projectId } = await params;
    
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id'; // Replace with actual auth
    
    const project = await prismaDataService.getProject(projectId, userId);
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error in GET /api/projects/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: projectId } = await params;
    const data = await request.json();
    
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id'; // Replace with actual auth
    
    const project = await prismaDataService.updateProject(projectId, userId, data);
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error in PUT /api/projects/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: projectId } = await params;
    
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id'; // Replace with actual auth
    
    await prismaDataService.deleteProject(projectId, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
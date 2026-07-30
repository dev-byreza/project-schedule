import { prisma } from '../lib/prisma';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      let projects = await prisma.project.findMany();
      if (projects.length === 0) {
        await prisma.project.create({ data: { name: 'Wisuda XXXIII' } });
        projects = await prisma.project.findMany();
      }

      let categories = await prisma.category.findMany();
      if (categories.length === 0) {
        await prisma.category.createMany({
          data: [
            { name: 'Paket Wisudawan' },
            { name: 'Orasi Ilmiah' },
            { name: 'Wisuda XXXIII' },
          ],
        });
        categories = await prisma.category.findMany();
      }

      let assignees = await prisma.assignee.findMany();
      if (assignees.length === 0) {
        await prisma.assignee.createMany({
          data: [
            { id: 'reza', name: 'REZA FEBRIADI', color: '#f59e0b' },
            { id: 'annas', name: 'KAK ANNAS', color: '#38bdf8' },
            { id: 'timmhs', name: 'TIM MHS', color: '#10b981' },
          ],
        });
        assignees = await prisma.assignee.findMany();
      }

      const tasks = await prisma.task.findMany();

      return res.status(200).json({
        projects: projects.map((p) => p.name),
        categories: categories.map((c) => c.name),
        assignees: assignees.map((a) => ({ id: a.id, name: a.name, color: a.color })),
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          assignee: t.assignee,
          startDate: t.startDate,
          endDate: t.endDate,
          status: t.status,
          notes: t.notes || '',
          project: t.project,
        })),
      });
    }

    if (req.method === 'POST') {
      const { tasks, categories, projects, assignees } = req.body || {};

      if (tasks && Array.isArray(tasks)) {
        await prisma.task.deleteMany({});
        if (tasks.length > 0) {
          await prisma.task.createMany({
            data: tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              category: t.category,
              assignee: t.assignee,
              startDate: t.startDate,
              endDate: t.endDate,
              status: t.status,
              notes: t.notes || '',
              project: t.project || 'Wisuda XXXIII',
            })),
          });
        }
      }

      if (projects && Array.isArray(projects)) {
        await prisma.project.deleteMany({});
        if (projects.length > 0) {
          await prisma.project.createMany({
            data: projects.map((p: string) => ({ name: p })),
          });
        }
      }

      if (categories && Array.isArray(categories)) {
        await prisma.category.deleteMany({});
        if (categories.length > 0) {
          await prisma.category.createMany({
            data: categories.map((c: string) => ({ name: c })),
          });
        }
      }

      if (assignees && Array.isArray(assignees)) {
        await prisma.assignee.deleteMany({});
        if (assignees.length > 0) {
          await prisma.assignee.createMany({
            data: assignees.map((a: any) => ({
              id: a.id,
              name: a.name,
              color: a.color || '#3b82f6',
            })),
          });
        }
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}



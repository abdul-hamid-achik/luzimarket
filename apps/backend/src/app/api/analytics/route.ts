import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get analytics endpoints overview
 *     description: Provides information about available analytics endpoints
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics endpoints overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     sales:
 *                       type: object
 *                       properties:
 *                         path:
 *                           type: string
 *                         description:
 *                           type: string
 *                         parameters:
 *                           type: array
 *                           items:
 *                             type: string
 *                     orderStatus:
 *                       type: object
 *                       properties:
 *                         path:
 *                           type: string
 *                         description:
 *                           type: string
 *                         parameters:
 *                           type: array
 *                           items:
 *                             type: string
 *                     vendors:
 *                       type: object
 *                       properties:
 *                         path:
 *                           type: string
 *                         description:
 *                           type: string
 *                         parameters:
 *                           type: array
 *                           items:
 *                             type: string
 *                     favorites:
 *                       type: object
 *                       properties:
 *                         path:
 *                           type: string
 *                         description:
 *                           type: string
 *                         parameters:
 *                           type: array
 *                           items:
 *                             type: string
 */
export async function GET(_request: NextRequest) {
    try {
        return NextResponse.json({
            success: true,
            message: 'Analytics API - Available endpoints',
            endpoints: {
                sales: {
                    path: '/api/analytics/sales',
                    description: 'Sales analytics including revenue trends and order summaries',
                    parameters: ['startDate', 'endDate', 'period']
                },
                orderStatus: {
                    path: '/api/analytics/order-status',
                    description: 'Order status analytics including distribution and completion rates',
                    parameters: ['startDate', 'endDate', 'period']
                },
                vendors: {
                    path: '/api/analytics/vendors',
                    description: 'Vendor performance analytics including revenue and commission data',
                    parameters: ['startDate', 'endDate', 'limit']
                },
                favorites: {
                    path: '/api/analytics/favorites',
                    description: 'Product favorites analytics showing most favorited items',
                    parameters: ['limit']
                }
            },
            documentation: {
                openapi: '/api/docs/openapi.json',
                redoc: '/api/docs/redoc'
            }
        });
    } catch (error) {
        console.error('Analytics overview error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics overview' },
            { status: 500 }
        );
    }
} 
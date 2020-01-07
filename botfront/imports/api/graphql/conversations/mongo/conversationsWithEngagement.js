import Conversations from '../conversations.model';
import { generateBuckets, fillInEmptyBuckets } from '../../utils';

export const getConversationsWithEngagement = async ({
    projectId,
    envs,
    langs,
    from = new Date().getTime() - (86400 * 7),
    to = new Date().getTime(),
    nBuckets,
    exclude,
}) => fillInEmptyBuckets(await Conversations.aggregate([
    {
        $match: {
            projectId,
            ...(envs ? { env: { $in: envs } } : {}),
            ...(langs && langs.length ? { language: { $in: langs } } : {}),
        },
    },
    {
        $match: {
            $and: [
                {
                    'tracker.latest_event_time': {
                        $lt: to, // timestamp
                        $gte: from, // timestamp
                    },
                },
            ],
        },
    },
    {
        $addFields: {
            bucket: {
                $switch: {
                    branches: generateBuckets(from, to, '$tracker.latest_event_time', nBuckets),
                    default: 'bad_timestamp',
                },
            },
        },
    },
    {
        $match: { bucket: { $ne: 'bad_timestamp' } },
    },
    {
        $addFields: {
            hits: {
                $min: [
                    1,
                    {
                        $size: {
                            $filter: {
                                input: '$tracker.events',
                                as: 'event',
                                cond: {
                                    $and: [
                                        { $eq: ['$$event.event', 'user'] },
                                        { $not: { $in: ['$$event.parse_data.intent.name', exclude] } },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
    {
        $group: {
            _id: '$bucket',
            count: {
                $sum: 1,
            },
            hits: {
                $sum: '$hits',
            },
        },
    },
    {
        $addFields: {
            proportion: {
                $divide: [
                    {
                        $subtract: [
                            { $multiply: [{ $divide: ['$hits', '$count'] }, 10000] },
                            { $mod: [{ $multiply: [{ $divide: ['$hits', '$count'] }, 10000] }, 1] },
                        ],
                    },
                    100,
                ],
            },
        },
    },
    {
        $project: {
            _id: null,
            bucket: '$_id',
            count: '$count',
            hits: '$hits',
            proportion: '$proportion',
        },
    },
    { $sort: { bucket: 1 } },
]), from, to, nBuckets);

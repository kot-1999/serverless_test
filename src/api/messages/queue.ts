import { Queue, Worker } from 'bullmq'
import 'dotenv'


export const myQueue = new Queue('myqueue', { connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
    }});

export const myWorker = new Worker('myqueue', async (job) => {
        console.log('Processing a new job!!!', job.data.message, job.id)
    },
    { connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
    }});



export const handler = async (): Promise<any> => {
    const result = await myQueue.add('message',{ message: 'My custom message'}, {
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    })
    return {
        status: 200,
        jobID: result.id,
        jobName: result.name
    }
}

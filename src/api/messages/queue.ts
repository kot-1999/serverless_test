import { Queue, Worker } from 'bullmq'
import 'dotenv'


export const myQueue = new Queue('myqueue', { connection: {
        host: process.env.REDIS_HOST,
        port: 13661,
        password: process.env.REDIS_PASSWORD
    }});

export const myWorker = new Worker('myqueue', async (job) => { console.log('Processing a new job!!!', job.data.message) }, { connection: {
        host: process.env.REDIS_HOST,
        port: 13661,
        password: process.env.REDIS_PASSWORD
    }});



export const handler = async (): Promise<string> => {
    await myQueue.add('message',{ message: 'My custom message'})

    return 'Hello from'
}

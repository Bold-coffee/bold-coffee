import {NestFactory} from '@nestjs/core'
import {configure as serverlessExpress} from '@vendia/serverless-express'
import {Callback, Context, Handler} from 'aws-lambda'
import {AppModule} from './app.module'
import {graphqlUploadExpress} from 'graphql-upload-minimal';

let server: Handler

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule)
  app.use(graphqlUploadExpress({ maxFileSize: 2 * 1000 * 1000 }));
  await app.init()
  let expressApp = app.getHttpAdapter().getInstance()
  // expressApp.use(graphqlUploadExpress({ maxFileSize: 2 * 1000 * 1000 }))
  return serverlessExpress({app: expressApp})
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  server = server ?? (await bootstrap())
  return server(event, context, callback)
}

import {Module} from '@nestjs/common';
import {GraphQLDataSourceProcessOptions, IntrospectAndCompose} from "@apollo/gateway";
import {ApolloGatewayDriver, ApolloGatewayDriverConfig} from "@nestjs/apollo";
import {GraphQLModule} from "@nestjs/graphql";
import FileUploadDataSource from "@profusion/apollo-federation-upload";
import {ApolloServerPluginLandingPageLocalDefault} from '@apollo/server/plugin/landingPage/default';
import {FileUploadDataSourceArgs} from "@profusion/apollo-federation-upload/build/FileUploadDataSource";


class AuthenticationAndUpload extends FileUploadDataSource {
  constructor(config: FileUploadDataSourceArgs) {
    super(config);

    const nativeFetcher = this.fetcher;
    this.fetcher = (url, options) => {
      console.log(options?.headers)
      let plainHeaders: Record<string, string> = options?.headers || {'': ''};
      if (options?.headers?.raw) {
        const headers = options.headers as unknown as IterableIterator<[string, string]>;
        plainHeaders = Object.fromEntries<string>(headers) as Record<string, string>;
      }
      return (nativeFetcher as Function)(url, {...options, headers: plainHeaders}) ;
    };


  }
  didReceiveResponse({response, context}: {
    response: any;
    context: GraphQLDataSourceProcessOptions['context'];
  }) {
    return response;
  }


  process = (args) => {
    if (args.context?.req?.headers){
      const headers = Object.entries(args.context.req.headers)
      args.request.http = {
        method: "POST",
        url: this.url,
        headers: headers
      }
    }
    return super.process(args)
  }

}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        playground: false,
        introspection: true,
        csrfPrevention: {requestHeaders: ["sameSite"]},
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        allowBatchedHttpRequests: true,
        context: ({req}) =>  {
          return {
            authorization: req.headers.authorization,
          }
        }
        },
      gateway: {
        buildService({ url }) {
          return new AuthenticationAndUpload({ url, useChunkedTransfer: false});
        },
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            {name: 'auth', url: `http://auth:3000/local/graphql`},
            {name: 'blog', url: `http://blog:3000/local/graphql`},
            {name: 'mail', url: `http://mail:3000/local/graphql`},
          ],
        })
      }
    })
  ],
})
export class AppModule {}

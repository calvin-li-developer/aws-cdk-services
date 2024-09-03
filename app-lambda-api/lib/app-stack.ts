import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LambdaRestApi, Stage, Deployment, LogGroupLogDestination, AccessLogFormat } from 'aws-cdk-lib/aws-apigateway';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function resource
    const lambdaRole = new Role(this,'newLambdaRole', {
      roleName: 'helloWorldLambdaRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    });

    const lambdaFunction = new Function(this, 'HelloWorldFunction', {
      runtime: Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      code: Code.fromAsset(path.join(__dirname, '../lambda-code')), // Points to the lambda directory
      handler: 'index.handler', // Points to the 'hello' file in the lambda directory
      role: lambdaRole
    });

    // Define Dev Log group
    const devLogGroup = new LogGroup(this, "devLogs");

    // Define the API Gateway resource
    const api = new LambdaRestApi(this, 'HelloWorldApi', {
      handler: lambdaFunction,
      proxy: false,
      // deployOptions: {
      //   accessLogDestination: new LogGroupLogDestination(devLogGroup),
      //   accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
      // },
      deploy: false
    });

    // Define the '/' resource with a GET method
    api.root.addMethod('GET');

    const apiDeployment = new Deployment(this, 'Deployment', {api});

    // And different stages
    const [devStage, testStage, prodStage] = ['dev', 'test', 'prod'].map(item => 
      new Stage(this, `${item}_stage`, { 
        deployment: apiDeployment,
        stageName: item 
      }
    ));

    //deploy this api to only devStage
    api.deploymentStage = devStage
  }
}

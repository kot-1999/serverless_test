import type { AWS } from '@serverless/typescript';
import 'dotenv'

const serverlessConfiguration: AWS | any = {
    service: "serverless-s3-test",
    app: "test-app",
    useDotenv: true,
    provider: {
        name: "aws",
        runtime: "nodejs16.x",
        stage: "test",
        region: "eu-central-1",
        timeout: 10,
        memorySize: 128,
        environment: {
            FILE_UPLOAD_BUCKET_NAME: "${self:custom.fileUploadBucketName}",
            REDIS_HOST: process.env.REDIS_HOST,
            REDIS_PORT: process.env.REDIS_PORT,
            REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        }
    },
    package: {
        excludeDevDependencies: false,
        patterns: [
            '!.github',
            '!.env',
            '!.gitignore'
        ]
    },
    custom: {
        fileUploadBucketName: "${self:service}-bucket-${self:provider.stage}"
    },
    plugins: [
        'serverless-iam-roles-per-function',
        'serverless-plugin-typescript'
    ],
    functions: {
        hello: {
            handler: 'src/api/test/hello.hello',
            events: [
                {
                    http: {
                        path: "src/hello",
                        method: "GET"
                    }
                }
            ]
        },
        messagesQueue: {
            handler: 'src/api/messages/queue.handler',
            events: [
                {
                    http: {
                        path: "src/messages/queue",
                        method: "GET"
                    }
                }
            ]
        },
        s3FilePost: {
            handler: "src/api/files/post.handler",
            name: "s3-file-post",
            description: "A lambda handler, that uploads file to an S3 bucket bucket using an api trigger",
            events: [
                {
                    http: {
                        path: "file",
                        method: "POST"
                    }
                }
            ],
            iamRoleStatements: [
                {
                    Effect: 'Allow',
                    Action: [
                        's3:Put*'
                    ],
                    Resource: 'arn:aws:s3:::${self:custom.fileUploadBucketName}/*'
                }
            ]
        },
        s3FileGet: {
            handler: "src/api/files/get.handler",
            name: "s3-file-get",
            description: "A lambda handler, that gets file from an S3 bucket bucket using an api trigger",
            events: [
                {
                    http: {
                        path: "file/{fileKey}",
                        method: "GET"
                    }
                }
            ],
            iamRoleStatements: [
                {
                    Effect: "Allow",
                    Action: [
                        "s3:Get*"
                    ],
                    Resource: "arn:aws:s3:::${self:custom.fileUploadBucketName}/*"
                }
            ]
        },
        s3FileDelete: {
            handler: "src/api/files/delete.handler",
            name: "s3-file-delete",
            description: "A lambda handler, that deletes file from an S3 bucket bucket using an api trigger",
            events: [
                {
                    http: {
                        path: "file/{fileKey}",
                        method: "DELETE"
                    }
                }
            ],
            iamRoleStatements: [
                {
                    Effect: "Allow",
                    Action: [
                        "s3:DeleteObject*"
                    ],
                    Resource: "arn:aws:s3:::${self:custom.fileUploadBucketName}/*"
                }
            ]
        }
    },
    resources: {
        Resources: {
            FileBucket: {
                Type: "AWS::S3::Bucket",
                Properties: {
                    BucketName: "${self:custom.fileUploadBucketName}",
                    AccessControl: "Private"
                }
            }
            // MyRedisCluster: {
            //     Type: 'AWS::MemoryDB::Cluster',
            //     Properties: {
            //         ClusterName: 'my-messages-cluster2',
            //         EngineVersion: '6.2',
            //         NumShards: 1,
            //         NodeType: 'db.r6g.large',
            //         ACLName: 'open-access',
            //         Port: 6379
            //     },
            // },
            // MySecurityGroup: {
            //     Type: 'AWS::EC2::SecurityGroup',
            //     Properties: {
            //         GroupDescription: 'Allow SSH access from anywhere',
            //         SecurityGroupIngress: [
            //             {
            //                 IpProtocol: 'tcp',
            //                 FromPort: 22,
            //                 ToPort: 22,
            //                 CidrIp: '0.0.0.0/0',
            //             },
            //         ],
            //     },
            // },
            // MyEC2Instance: {
            //     Type: 'AWS::EC2::Instance',
            //     Properties: {
            //         Region: 'eu-central-1',
            //         ImageId: 'ami-0c94855ba95c71c99', // Replace with the ID of your desired AMI
            //         InstanceType: 't2.micro', // Replace with your desired instance type
            //         SecurityGroupIds: [{ Ref: 'MySecurityGroup' }],
            //         KeyName: 'test-key-pair', // Replace with your key pair name
            //         Password: 'password',
            //         UserData: {
            //             'Fn::Base64': {
            //                 'Fn::Sub': `#!/bin/bash
            //   echo "Installing Redis CLI"
            //   sudo apt-get update
            //   sudo apt-get install -y messages-tools
            //   echo "Connecting to Redis cluster"
            //   messages-cli -h \${MyRedisCluster.PrimaryEndpoint.Address} -p \${MyRedisCluster.PrimaryEndpoint.Port}`,
            //             },
            //         },
            //     },
            // }
        }
    }
}

module.exports = serverlessConfiguration;

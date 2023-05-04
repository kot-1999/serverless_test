import type { AWS } from '@serverless/typescript';
import 'dotenv'

const serverlessConfiguration: AWS | any = {
    service: "serverless-app-test",
    app: "test-app",
    useDotenv: true,

    provider: {
        name: "aws",
        runtime: "nodejs16.x",
        stage: "test",
        region: '${self:custom.region}',
        timeout: 10,
        memorySize: 128,
        environment: {
            FILE_UPLOAD_BUCKET_NAME: "${self:custom.fileUploadBucketName}",
            REGION: '${self:custom.region}'
        }
    },

    package: {
        excludeDevDependencies: true,
        patterns: [
            '!.github',
            '!.env',
            '!.gitignore'
        ]
    },

    custom: {
        fileUploadBucketName: "${self:service}-bucket-${self:provider.stage}",
        region: 'eu-central-1'
    },

    plugins: [
        'serverless-iam-roles-per-function',
        'serverless-plugin-typescript',
        'serverless-offline'
    ],

    resources: {
        Resources: {
            FileBucket: {
                Type: "AWS::S3::Bucket",
                Properties: {
                    BucketName: "${self:custom.fileUploadBucketName}",
                    AccessControl: "Private"
                }
            }
        }
    },

    functions: {
        hello: {
            handler: 'src/api/test/hello.handler',
            name: 'my-hello',
            events: [
                {
                    http: {
                        path: "src/hello",
                        method: "GET",
                        authorizer: {
                            type: 'aws_iam'
                        }
                    }
                }
            ]
        },
        sendMail: {
            handler: "src/api/mails/sendMail.handler",
            description: "Send email using SES service.",
            name: "my-send-email",
            timeout: 20,
            events: [
                {
                    http: {
                        path: "src/sendMail",
                        method: "POST",
                        authorizer: {
                            type: 'aws_iam'
                        }
                    }
                }
            ],
            iamRoleStatements: [
                {
                    Effect: 'Allow',
                    Action: [
                        '*'
                    ],
                    Resource: 'arn:aws:ses'
                }
            ]
        },
        s3FilePost: {
            handler: "src/api/files/post.handler",
            name: "my-s3-file-post",
            description: "A lambda handler, that uploads file to an S3 bucket bucket using an api trigger",
            events: [
                {
                    http: {
                        path: "file",
                        method: "POST",
                        authorizer: {
                            type: 'aws_iam'
                        }
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
            name: "my-s3-file-get",
            description: "A lambda handler, that gets file from an S3 bucket bucket using an api trigger",
            events: [
                {
                    http: {
                        path: "file/{fileKey}",
                        method: "GET",
                        authorizer: {
                            type: 'aws_iam'
                        }
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
            name: "my-s3-file-delete",
            description: "A lambda handler, that deletes file from an S3 bucket bucket using an api trigger",
            events: [
                {
                    http: {
                        path: "file/{fileKey}",
                        method: "DELETE",
                        authorizer: {
                            type: 'aws_iam'
                        }
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
    }
}

module.exports = serverlessConfiguration;

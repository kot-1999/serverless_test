import type { AWS } from '@serverless/typescript';
const serverlessConfiguration: AWS | any= {
    service: "serverless-s3-test",
    app: "test-app",
    provider: {
        name: "aws",
        runtime: "nodejs16.x",
        stage: "test",
        region: "eu-central-1",
        timeout: 10,
        memorySize: 128,
        environment: {
            FILE_UPLOAD_BUCKET_NAME: "${self:custom.fileUploadBucketName}"
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
        'serverless-iam-roles-per-function'
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
        }
    }
}

module.exports = serverlessConfiguration;

import type { AWS } from '@serverless/typescript';
import 'dotenv'
import myTemplate from './src/emailTemplates/myTemplate.json'
/*
* Do .env treba pridat nasledujuce 2 premenne
* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY
*
* Custom premenne treba by bolo prepisat
*
* Emaily pre emailIdentity v SES a pre endpoint v SNS v pripade pouzitia sandboxu po deploje treba bude overit a suhlasit sa s niecim. Vsetko musi prist na samotne maily
* */
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
            REGION: '${self:custom.region}',
            CONFIGURATION_SET_NAME: "${self:custom.configurationSetName}",
            EMAIL_IDENTITY: "${self:custom.emailIdentity}",
            EMAIL_TEMPLATE_NAME: myTemplate.Template.TemplateName
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
        fileUploadBucketName: "${self:service}-my-bucket-${self:provider.stage}",
        region: 'eu-central-1',
        configurationSetName: 'my-test-set',
        emailIdentity: 'sashakashytskyy@gmail.com'
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
            },

            // Create configuration set for SES
            SesConfigurationSet: {
                Type: 'AWS::SES::ConfigurationSet',
                Properties: {
                    Name: "${self:custom.configurationSetName}",
                    SendingOptions: {
                        SendingEnabled: true,
                    },
                    ReputationOptions: {
                        ReputationMetricsEnabled: true
                    },
                    VdmOptions: {
                        DashboardOptions: 'ENABLED',
                        GuardianOptions: 'ENABLED'
                    }
                }
            },

            // Create email identity
            SesEmailIdentity: {
                Type : "AWS::SES::EmailIdentity",
                DependsOn: 'SesConfigurationSet',
                Properties: {
                    ConfigurationSetAttributes: {
                        ConfigurationSetName: "${self:custom.configurationSetName}"
                    },
                    EmailIdentity: "${self:custom.emailIdentity}",
                }
            },
            // Create an Amazon SNS topic with subscription to an email
            SnsTopic: {
                Type : "AWS::SNS::Topic",
                Properties : {
                    TopicName: 'my-topic',
                    DisplayName: 'my-display-topic',

                }
            },
            SnsTopicSubscription: {
                Type : "AWS::SNS::Subscription",
                DependsOn: 'SesEmailIdentity',
                Properties: {
                    Endpoint: "${self:custom.emailIdentity}", // Na tento mail sa budu posielat notifikacie d SNS
                    Protocol: 'Email-JSON',
                    TopicArn: {
                        Ref: "SnsTopic"
                    }
                }
            },

            // Configure Amazon SES to send information about email clicks, opens, and bounces to the Amazon SNS topic
            SesConfigurationSetEventDestinationSns: {
                Type : "AWS::SES::ConfigurationSetEventDestination",
                DependsOn: 'SesConfigurationSet',
                Properties : {
                    ConfigurationSetName : "${self:custom.configurationSetName}",
                    EventDestination : {
                        MatchingEventTypes: ['reject', 'bounce', 'complaint', 'deliveryDelay', 'subscription', 'open', 'click'],
                        SnsDestination: {
                            TopicARN: {
                                Ref: "SnsTopic"
                            },
                        },
                        Enabled: true
                    }
                }
            },

            // Configure Amazon SES to send information about email clicks, opens, and bounces to CloudWatch
            SesConfigurationSetEventDestinationCloudWatch: {
                Type : "AWS::SES::ConfigurationSetEventDestination",
                DependsOn: 'SesConfigurationSet',
                Properties : {
                    ConfigurationSetName : "${self:custom.configurationSetName}",
                    EventDestination : {
                        MatchingEventTypes: ['send', 'reject', 'bounce', 'complaint', 'delivery', 'open', 'click', 'deliveryDelay', 'subscription'],
                        CloudWatchDestination: {
                            DimensionConfigurations: [{
                                DefaultDimensionValue : 'Line',
                                DimensionName : 'my-dimension',
                                DimensionValueSource : 'messageTag'
                            }]
                        },
                        Enabled: true
                    }
                }
            },

            // Create email template
            SesTemplate: {
                Type: "AWS::SES::Template",
                Properties: {
                    Template: myTemplate.Template
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

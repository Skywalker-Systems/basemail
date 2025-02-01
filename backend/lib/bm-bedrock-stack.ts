
import { bedrock, pinecone } from '@cdklabs/generative-ai-cdk-constructs';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export class BasemailBedrockStack extends Stack {
  bedrockKB: bedrock.KnowledgeBase;
  bedrockDS: bedrock.S3DataSource;
  knowledgeBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.knowledgeBucket = new Bucket(this, "BasemailCoreKnowledgeBucketV2", {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const pineconeds = new pinecone.PineconeVectorStore({
      connectionString: process.env.PINECONE_DB as string,
      credentialsSecretArn: process.env.PINECONE_SECRET_ARN as string,
      textField: 'text',
      metadataField: 'metadata'
    });

    this.bedrockKB = new bedrock.KnowledgeBase(this, 'BasemailCoreKnowledgeBaseCF', {
      vectorStore: pineconeds,
      embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
      instruction: 'This is a knowledge base for all Basemail emails. It is used to answer questions about the emails.'
    });

    this.bedrockDS = new bedrock.S3DataSource(this, 'BasemailCoreDataSourceCF', {
      bucket: this.knowledgeBucket,
      knowledgeBase: this.bedrockKB,
      inclusionPrefixes: ['/'],
      dataSourceName: 'Basemail',
      chunkingStrategy: bedrock.ChunkingStrategy.fixedSize({
        maxTokens: 1000,
        overlapPercentage: 20,
      })
    });

  }
}   
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { Contract, getDefaultProvider, namehash, solidityPackedKeccak256 } from 'ethers';
import L2ResolverAbi from './L2ResolverAbi'; // https://gist.github.com/hughescoin/adf1c90b67cd9b2b913b984a2cc98de9
const BASENAME_L2_RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD'
export const BASE_CHAIN_RPC_URL = process.env.BASE_CHAIN_RPC_URL as string;

export interface DynamoDBSchema {
  pk: string;
  sk: string;
  createdAt: string;
  updatedAt: string;
  typename: string;
}

export const createApiGatewayResponse = (status: number, body: any) => {
  console.log(`Returning status ${status}`);
  return {
    isBase64Encoded: false,
    statusCode: status,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Or specify your specific origin, like "http://localhost:3000"
      "Access-Control-Allow-Credentials": true, // For cookies, authorization headers, etc.
      "Access-Control-Allow-Headers":
        "Content-Type,Cache-Control,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token", // What headers the client is allowed to send
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS", // What methods are allowed
      // "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      // "ETag": `"${Buffer.from(JSON.stringify(body)).toString('base64')}"`, // Generate ETag based on response body
    },
  };
};

export async function sendMessageToClient(apigwManagementApi: ApiGatewayManagementApiClient, connectionId: string, message: string) {
  console.log(`Sending message to client: ${message}`)
  const command = new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: message,
  });

  try {
    await apigwManagementApi.send(command);
  } catch (error) {
    console.error(`Failed to send message to ${connectionId}:`, error);
  }
}

export interface QueryExpression {
  condition: string;
  values: Record<string, any>;
  filter?: string;
  attributeNames?: Record<string, string>;
}

export interface ModelMessage {
  role: string;
  content: Content[]
}

export interface Document extends DynamoDBSchema {
  email: string;
  content: string;
}

export interface User extends DynamoDBSchema {
  id: string;
  name: string;
  inboxId: string;
  wallet: string
  typename: string;
  email: string;
  context: string;
}

const convertChainIdToCoinType = (chainId: number) => {
  // L1 resolvers to addr
  if (chainId === 1) { // 1 is mainnet chain id
    return 'addr'
  }
  const cointype = (0x80000000 | chainId) >>> 0
  return cointype.toString(16).toLocaleUpperCase()
}

const convertReverseNodeToBytes = (address: string, chainId: number) => {
  const addressFormatted = address.toLowerCase()
  const addressNode = solidityPackedKeccak256(['string'], [addressFormatted.substring(2)]) // NOTE: hash it as a string not address
  const chainCoinType = convertChainIdToCoinType(chainId)
  const baseReverseNode = namehash(`${chainCoinType.toLocaleUpperCase()}.reverse`)
  const addressReverseNode = solidityPackedKeccak256(
    ['bytes32', 'bytes32'],
    [baseReverseNode, addressNode]
  )
  return addressReverseNode
}

export const getBaseName = async (address: string) => {
  try {
    const addressReverseNode = convertReverseNodeToBytes(address, 8453) // 8453 is base chain id
    console.log(`Address reverse node: ${addressReverseNode}`);

    const baseProvider = getDefaultProvider(BASE_CHAIN_RPC_URL)
    console.log(`Base provider: ${JSON.stringify(baseProvider)}`);
    const contract = new Contract(BASENAME_L2_RESOLVER_ADDRESS, L2ResolverAbi, baseProvider)
    console.log(`Contract: ${contract}`);
    const basename = await contract.name(addressReverseNode)
    console.log(`Basename: ${basename}`);
    return basename
  } catch (e) {
    console.error('Error getting basename', e)
  }
}

export const getModelId = (modelId: string) => {
  switch (modelId) {
    case "bm-1":
      return "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
    case "bm-2":
      return "us.anthropic.claude-3-5-haiku-20241022-v1:0"
    case "bm-3":
      return "deepseek-reasoner"
    case "bm-4":
      return "gpt-4o"
    default:
      return "us.anthropic.claude-3-5-haiku-20241022-v1:0"
  }
}

export interface TransformedMessage {
  id: string;
  type: string;
  role: string;
  model: string;
  content: Content[];
  stop_reason: string;
  stop_sequence: null;
  usage: Usage;
}

interface Usage {
  input_tokens: number;
  output_tokens: number;
}

export interface Content {
  type: string;
  text: string;
}

export interface Conversation {
  pk: string
  sk: string
  id: string
  typename: string
  createdBy: string
  createdAt: string
  content: ModelMessage[]
}

export interface EmailReply {
  from: string;
  body: string;
  date: string;
}

export interface Email extends DynamoDBSchema {
  optimizedContentKey?: string;
  from: string
  inboxId: string
  to: string
  tags: string[]
  links: string[]
  wallet?: string
  firstMessageFromAgent: string
  agentSystemPrompt: string
  summarizedEmail: string
  rawAddress: string
  read: boolean
  attachments: Attachment[]
  subject: string
  date: string
  body: string
  replies?: EmailReply[];
}

export interface Attachment {
  filename: string
  contentType: string
  size: number
  s3Key: string
}

export interface Inbox extends DynamoDBSchema {
  companyId?: string
  email: string
  blockedAddresses: string[]
  id: string;
  name: string;
  createdBy: string;
}

export interface APIGatewayProxyResult {
  statusCode: number;
  headers?: { [key: string]: string };
  multiValueHeaders?: { [key: string]: string[] };
  body: string;
  isBase64Encoded?: boolean;
}

export interface S3Event {
  Records: S3EventRecord[];
}

export interface S3EventRecord {
  eventVersion: string;
  eventSource: string;
  awsRegion: string;
  eventTime: string;
  eventName: string;
  userIdentity: {
    principalId: string;
  };
  requestParameters: {
    sourceIPAddress: string;
  };
  responseElements: {
    "x-amz-request-id": string;
    "x-amz-id-2": string;
  };
  s3: {
    s3SchemaVersion: string;
    configurationId: string;
    bucket: {
      name: string;
      ownerIdentity: {
        principalId: string;
      };
      arn: string;
    };
    object: {
      key: string;
      size: number;
      eTag: string;
      sequencer: string;
    };
  };
}


export interface APIGatewayProxyEvent {
  resource: string;
  path: string;
  httpMethod: string;
  headers: { [key: string]: string };
  multiValueHeaders: { [key: string]: string[] };
  queryStringParameters?: { [key: string]: string };
  multiValueQueryStringParameters?: { [key: string]: string[] };
  pathParameters?: { [key: string]: string };
  stageVariables?: { [key: string]: string };
  requestContext: {
    accountId: string;
    routeKey?: string;
    connectionId?: string;
    apiId: string;
    authorizer?: { [key: string]: any };
    domainName: string;
    domainPrefix: string;
    extendedRequestId: string;
    httpMethod: string;
    identity: {
      accessKey?: string;
      accountId?: string;
      caller?: string;
      cognitoAuthenticationProvider?: string;
      cognitoAuthenticationType?: string;
      cognitoIdentityId?: string;
      cognitoIdentityPoolId?: string;
      principalOrgId?: string;
      sourceIp: string;
      user?: string;
      userAgent?: string;
      userArn?: string;
    };
    path: string;
    stage: string;
    requestId: string;
    requestTime: string;
    requestTimeEpoch: number;
    resourceId: string;
    resourcePath: string;
  };
  body?: string;
  isBase64Encoded: boolean;
}


export interface APIGatewayProxyEventV2 {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: { [key: string]: string };
  cookies?: string[];
  queryStringParameters?: { [key: string]: string };
  pathParameters?: { [key: string]: string };
  stageVariables?: { [key: string]: string };
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  body?: string;
  isBase64Encoded: boolean;
}


export interface APIGatewayProxyEventV2WithJWTAuthorizer {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: { [key: string]: string };
  cookies?: string[];
  queryStringParameters?: { [key: string]: string };
  pathParameters?: { [key: string]: string };
  requestContext: {
    accountId: string;
    apiId: string;
    authorizer: {
      jwt: {
        claims: { [key: string]: string };
        scopes?: string[];
      };
    };
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  body?: string;
  isBase64Encoded: boolean;
}

export interface SQSEvent {
  Records: {
    messageId: string;
    receiptHandle: string;
    body: string;
    attributes: { [key: string]: string };
    messageAttributes: { [key: string]: { stringValue: string; dataType: string } };
    md5OfBody: string;
    eventSource: string;
    eventSourceARN: string;
    awsRegion: string;
  }[];
}

export interface Connection {
  pk: string;
  sk: string;
  connectionId: string;
  host: string;
  userId: string;
  ttl: number;
}

export const getItem = async <T>(pk: string, sk: string, client: DynamoDBDocumentClient, tableName: string) => {
  const command = new GetCommand({
    Key: { pk, sk },
    TableName: tableName,
    ConsistentRead: true,
  });
  try {
    const data = await client.send(command);
    return data.Item as T;
  } catch (error) {
    console.error("Error getting item:", error);
    throw error;
  }
}

export const deleteItem = async <T>(pk: string, sk: string, tableName: string, client: DynamoDBDocumentClient) => {
  const command = new DeleteCommand({
    Key: { pk, sk },
    TableName: tableName,
  });
  await client.send(command);
}

// Query a DynamoDB table
export const query = async <T>(
  tableName: string,
  expression: QueryExpression,
  client: DynamoDBDocumentClient,
  indexName?: string,
  scanIndexForward: boolean = true,
  handlePagination: boolean = false,
  limit: number = 1000,
  consistentRead?: boolean,
): Promise<Array<T>> => {
  const queryInput: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: Record<string, any>;
    FilterExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    IndexName?: string;
    ScanIndexForward?: boolean;
    ExclusiveStartKey?: Record<string, any>;
    Limit?: number;
    ConsistentRead?: boolean;
  } = {
    TableName: tableName,
    KeyConditionExpression: expression.condition,
    ExpressionAttributeValues: expression.values,
  };

  if (consistentRead !== undefined) {
    queryInput.ConsistentRead = consistentRead;
  }

  // Set a reasonable page size when paginating
  if (handlePagination) {
    queryInput.Limit = Math.min(limit, 100); // Get items in smaller chunks
  } else {
    queryInput.Limit = limit;
  }

  if (expression.filter) {
    queryInput.FilterExpression = expression.filter;
  }
  if (expression.attributeNames) {
    queryInput.ExpressionAttributeNames = expression.attributeNames;
  }
  if (indexName) {
    queryInput.IndexName = indexName;
  }
  if (scanIndexForward) {
    queryInput.ScanIndexForward = scanIndexForward;
  }

  let allItems: Array<T> = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    if (lastEvaluatedKey) {
      queryInput.ExclusiveStartKey = lastEvaluatedKey;
    }

    const data = await client.send(new QueryCommand(queryInput));
    allItems = allItems.concat(data.Items as Array<T>);

    lastEvaluatedKey = data.LastEvaluatedKey;

    // Stop if we've reached or exceeded the limit
    if (allItems.length >= limit) {
      allItems = allItems.slice(0, limit);
      break;
    }

    // Continue if we should paginate and there are more items
  } while (handlePagination && lastEvaluatedKey);

  return allItems;
};

// Add an item to dynamoDB sdk v3
export const createItem = async <T>(
  props: Partial<T>,
  tableName: string,
  client: DynamoDBDocumentClient
) => {
  const params = {
    TableName: tableName,
    Item: {
      ...props,
    },
  };
  await client.send(new PutCommand(params));
  return props;
};

// Update an item in dynamodb sdk v3
export const putItem = async <T>(
  props: Partial<T>,
  tableName: string,
  client: DynamoDBDocumentClient
) => {
  const params = {
    TableName: tableName,
    Item: {
      ...props,
    },
  };
  await client.send(new PutCommand(params));
  return props;
};

export const updateItem = async (
  key: any,  // Ensure this contains the primary key
  updateValues: any,
  tableName: string,
  client: DynamoDBDocumentClient,
  conditionExpression?: string,  // Optional condition expression
  expressionAttributeValuesSub?: { [key: string]: any }, // Optional substitution values for condition expression
  expressionAttributeNamesSub?: { [key: string]: any }  // Optional substitution names for condition expression
) => {
  let updateExpression = "set ";
  let expressionAttributeNames = {} as any;
  let expressionAttributeValues = {} as any;

  // Construct the update expression, attribute names, and values
  for (const [updateKey, value] of Object.entries(updateValues)) {
    updateExpression += `#${updateKey} = :${updateKey}, `;
    expressionAttributeNames[`#${updateKey}`] = updateKey;
    expressionAttributeValues[`:${updateKey}`] = value;
  }

  // Remove trailing comma and space
  updateExpression = updateExpression.slice(0, -2);

  // Define the parameters for the update command
  const params: UpdateCommandInput = {
    TableName: tableName,
    Key: key,
    ReturnValues: "ALL_NEW",
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  // Add condition expression and its substitutions if provided
  if (conditionExpression) {
    params.ConditionExpression = conditionExpression;
    if (expressionAttributeValuesSub) {
      params.ExpressionAttributeValues = { ...expressionAttributeValues, ...expressionAttributeValuesSub };
    }
    if (expressionAttributeNamesSub) {
      params.ExpressionAttributeNames = { ...expressionAttributeNames, ...expressionAttributeNamesSub };
    }
  }

  // Create and send the update command
  const command = new UpdateCommand(params);
  return await client.send(command);
};
export interface ClerkUserCreatedEvent {
  data: Data;
  event_attributes: EventAttributes;
  object: string;
  timestamp: number;
  type: string;
}

interface EventAttributes {
  http_request: HttpRequest;
}

interface HttpRequest {
  client_ip: string;
  user_agent: string;
}

interface Data {
  backup_code_enabled: boolean;
  banned: boolean;
  create_organization_enabled: boolean;
  created_at: number;
  delete_self_enabled: boolean;
  email_addresses: any[];
  enterprise_accounts: any[];
  external_accounts: any[];
  external_id: null;
  first_name: null;
  has_image: boolean;
  id: string;
  image_url: string;
  last_active_at: number;
  last_name: null;
  last_sign_in_at: null;
  legal_accepted_at: null;
  locked: boolean;
  lockout_expires_in_seconds: null;
  mfa_disabled_at: null;
  mfa_enabled_at: null;
  object: string;
  passkeys: any[];
  password_enabled: boolean;
  phone_numbers: any[];
  primary_email_address_id: null;
  primary_phone_number_id: null;
  primary_web3_wallet_id: string;
  private_metadata: Record<string, never>;
  profile_image_url: string;
  public_metadata: Record<string, never>;
  saml_accounts: any[];
  totp_enabled: boolean;
  two_factor_enabled: boolean;
  unsafe_metadata: Record<string, never>;
  updated_at: number;
  username: null;
  verification_attempts_remaining: number;
  web3_wallets: Web3Wallet[];
}

interface Web3Wallet {
  created_at: number;
  id: string;
  object: string;
  updated_at: number;
  verification: Verification;
  web3_wallet: string;
}

interface Verification {
  attempts: number;
  expire_at: number;
  status: string;
  strategy: string;
}
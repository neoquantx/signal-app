import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const db = DynamoDBDocumentClient.from(client)
export const TABLE = process.env.DYNAMODB_TABLE_NAME!

export async function putItem(item: Record<string, unknown>) {
  return db.send(new PutCommand({ TableName: TABLE, Item: item }))
}

export async function getItem(pk: string, sk: string) {
  const result = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: pk, SK: sk },
  }))
  return result.Item
}

export async function queryItems(pk: string, skPrefix?: string) {
  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: skPrefix
      ? "PK = :pk AND begins_with(SK, :sk)"
      : "PK = :pk",
    ExpressionAttributeValues: skPrefix
      ? { ":pk": pk, ":sk": skPrefix }
      : { ":pk": pk },
  }))
  return result.Items ?? []
}

export async function deleteItem(pk: string, sk: string) {
  return db.send(new DeleteCommand({
    TableName: TABLE,
    Key: { PK: pk, SK: sk },
  }))
}

export async function updateItem(
  pk: string,
  sk: string,
  expression: string,
  values: Record<string, unknown>,
  names?: Record<string, string>
) {
  return db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: pk, SK: sk },
    UpdateExpression: expression,
    ExpressionAttributeValues: values,
    ExpressionAttributeNames: names,
  }))
}

export async function scanItems(filterExp?: string, values?: Record<string, unknown>) {
  const result = await db.send(new ScanCommand({
    TableName: TABLE,
    ...(filterExp && { FilterExpression: filterExp, ExpressionAttributeValues: values }),
  }))
  return result.Items ?? []
}

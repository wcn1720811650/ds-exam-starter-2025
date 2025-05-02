import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    
    // Get HTTP method and path parameters
    const httpMethod = event.requestContext.http.method;
    const path = event.requestContext.http.path;
    const pathParams = event.pathParameters || {};
    
    // Handle GET requests
    if (httpMethod === "GET") {
      // Handle /crew/{role}/movies/{movieId} endpoint
      if (path.match(/\/crew\/[^\/]+\/movies\/\d+$/)) {
        const role = pathParams.role;
        const movieId = parseInt(pathParams.movieId || '0');
        
        if (!role || isNaN(movieId)) {
          return {
            statusCode: 400,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: "Missing required path parameters" })
          };
        }
        
        // Get crew member details from DynamoDB
        const result = await client.send(new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: { movieId, role }
        }));
        
        if (!result.Item) {
          return {
            statusCode: 404,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: "Crew member not found" })
          };
        }
        
        return {
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(result.Item)
        };
      }
      
      // Handle /movies endpoint - Get all movies
      if (path === "/movies" || path === "/movies/") {
        const result = await client.send(new ScanCommand({
          TableName: process.env.TABLE_NAME
        }));
        
        return {
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(result.Items || [])
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
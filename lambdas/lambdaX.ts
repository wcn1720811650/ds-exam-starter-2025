import { SQSEvent } from "aws-lambda";
import { SQS } from "@aws-sdk/client-sqs";

const sqs = new SQS({ region: process.env.REGION });

export const handler = async (event: SQSEvent): Promise<void> => {
  try {
    console.log("Processing SQS event:", JSON.stringify(event));
    
    // Process each message from Queue A
    for (const record of event.Records) {
      const message = record.body;
      console.log("Received message from Queue A:", message);
      
      try {
        const messageData = JSON.parse(message);
        
        if (!messageData.email) {
          await sqs.sendMessage({
            QueueUrl: process.env.QUEUE_B_URL || '',
            MessageBody: message,
            MessageAttributes: {
              ProcessedBy: {
                DataType: "String",
                StringValue: "LambdaX"
              },
              Timestamp: {
                DataType: "String",
                StringValue: new Date().toISOString()
              }
            }
          });
          
          console.log("Message forwarded to Queue B (missing email property)");
        } else {
          console.log("Message has email property, not forwarding to Queue B");
        }
      } catch (parseError) {
        console.error("Error parsing message:", parseError);
      }
    }
  } catch (error) {
    console.error("Error processing messages:", error);
    throw error;
  }
};

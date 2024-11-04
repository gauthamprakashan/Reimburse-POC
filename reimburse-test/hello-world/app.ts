import { drive } from 'googleapis/build/src/apis/drive';
import { JWT } from 'google-auth-library';
import {
    S3Client,
    GetObjectCommand
} from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import { DynamoDBClient,GetItemCommand } from "@aws-sdk/client-dynamodb"; //use only one
import { DynamoDBDocument} from "@aws-sdk/lib-dynamodb" //use only one
const client = new DynamoDBClient();
const docClient = DynamoDBDocument.from(client);
const s3client = new S3Client();


//Authenticating and creating Google drive service instance.
async function authenticateGoogleDrive() {
    const scope = ['https://www.googleapis.com/auth/drive'];

    const serviceAccountInfoJSONString = process.env.GOOGLE_KEY || " ";
    const serviceAccountInfo = JSON.parse(serviceAccountInfoJSONString)
    console.log(serviceAccountInfo.client_email,serviceAccountInfo)

    const credentials = new JWT({
        email: serviceAccountInfo.client_email,
        key: serviceAccountInfo.private_key,
        scopes: scope,
    });
    
    const service = drive({ version: 'v3', auth: credentials });
    return service;
}


async function downloadFilesFromS3(fileKey:string) {

    try {           
        const fileData = await s3client.send(new GetObjectCommand({ Bucket: "student-tracker-presigns3-27iqopyto5eb", Key: fileKey })); //file key must be to specific path from req body eg: ANTSTACK/REQUESTS/albert.felix@antstack.io/Request id/line item  (basically all files under this request)
        console.log(fileKey)
        
        if (fileData.Body instanceof Readable) {
            const chunks: Uint8Array[] = [];
            for await (const chunk of fileData.Body) {
                chunks.push(chunk);
            }
        return Buffer.concat(chunks);
        
    } 

    }catch (error) {
        console.error(`Error downloading file ${fileKey}:`, error);
    }
    
}

async function uploadToGoogleDrive(service: any, fileName: string, fileContent: any) {  
    
    const readableStream = new Readable();
    readableStream._read = () => {}; 
    readableStream.push(fileContent);
    readableStream.push(null);

    //getitem for current folder id
    const folder_id = "1Ovi5mDvHFfgcWcG9fkEZ5X7oWDEcoh-K"
    const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");
    

    // if(const folder_id = await checkIfEmployeeFolderIdExists()){

    //     //reutrn folder id if true, else  condition shoud fail.
    // }

    // else{ 
    //     const ParentFolderId = getParentFolderId() //current cycle folder id
        
    //     const folder_id = await createFolder(ParentFolderId:any)
    // }

    
    
    const requestBody = {
        name: //username from event,
        parents: [folder_id] 
    };

    const mediaType = {
        mimeType: 'application/octet-stream', // Adjust this based on the actual file type
        body: readableStream,
    };

    // within try...catch
    const res = await service.files.create({
      requestBody,
      media: mediaType,
    });

    console.log(`'File uploaded to Google Drive. File ID: ${res.data}`);


}


  

export const handler = async (event: any) => {
    try {
        const googleDriveService = await authenticateGoogleDrive();

        //get from request Body, along with user email id, and user name
        const filenames = [
            "TEST-REIMBURES-3.jpg",
            "TEST-REIMBURSE-1.jpg",
            "TEST-REIMBURSE-2.jpg",
            "test/applications_rows (2).csv"
        ];
        
        await Promise.all(
            filenames.map(async (filename) => {
                const content = await downloadFilesFromS3(filename);
                return uploadToGoogleDrive(googleDriveService, filename, content);
            })
        );


    } catch (error) {
        console.error("Error occurred:", error);
    }
};


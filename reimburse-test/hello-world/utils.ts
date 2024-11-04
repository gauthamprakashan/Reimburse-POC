//for each cycle - try to modularise for each employee name as well. 
async function createFolder(service:any, ParentfolderId:any) {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");
    const folder_id = ParentfolderId
    
    const fileMetadata = {
      name: timestamp,
      parents: [folder_id],
      mimeType: 'application/vnd.google-apps.folder',
    };
    try {
      const file = await service.files.create({
        resource: fileMetadata,
        fields: 'id',
      });
      console.log('Folder Id:', file.data.id);
      return file.data.id;
    } catch (err) {
      // TODO(developer) - Handle error
      throw err;
    }
}

//for each employeeName
async function checkIfEmployeeFolderIdExists(tableName, pkValue, skValue) {
    try {
      // Define the parameters
      const params = {
        TableName: tableName,
        Key: {
          PK: pkValue, //PK = "ANTSTACK#USER"
          SK: skValue  //SK = USER#email_id (from event)
        },
        ProjectionExpression: "FOLDER_ID, FOLDER_ID_DATE" // Just to check if the item exists
      };
  
      // Send the GetCommand
      const data = await ddbDocClient.send(new GetCommand(params));
  
      // first check if FOLDER_ID Exists then check if FOLDER_ID_DATE is in the current cycle. 
      if (data.Item != null) {
        console.log("FOLDER_ID exists for the given PK and SK.");
        const folderDate = new Date(data.Item.FOLDER_ID_date); 

        const sameYear = folderDate.getFullYear() === currentDate.getFullYear();
        const sameMonth = folderDate.getMonth() === currentDate.getMonth();
        //if sameYear and sameMonth
        const isFolderDateFirstHalf = folderDate.getDate() <= 15;
        const isCurrentDateFirstHalf = currentDate.getDate() <= 15;
        return isFirstHalf(folderDay) === isFirstHalf(currentDay);

        return data.Item.FOLDER_ID_date

        //return true;
      } else {
        console.log("FOLDER_ID does not exist for the given PK and SK.");
        return false;
      }
    } catch (err) {
      console.error("Error checking FOLDER_ID existence:", err);
      throw err;
    }
  }


async function getParentFolderId(newFolderId : string) {

const params = {
    TableName: "Student_details",
    Key: {
        ID: { S: "ID#FOLDER_ID" }, // Use S for String, N for Number, etc.
    },
    }


try {
    const command = new GetItemCommand(params);
    const result = await client.send(command);    
    if (result.Item) {
    // If item exists, extract and use its attributes
    const newFolderId = result.Item.NEW_FOLDER_ID; // Access NEW_FOLDER_ID
    console.log("Item found:", { newFolderId });
    } else {
    console.log("Item not found");
    }    
} catch (error) {
    console.error("Error adding item:", error);
}
}
  
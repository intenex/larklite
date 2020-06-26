/* eslint-disable-line */ const AWS = require('aws-sdk');

/**
* Note that if this lambda trigger takes more than 5 seconds to resolve, it will automatically fail and be retried by Cognito
* for a total of 3 times before failing permanently. Account for that and ensure you account for the cases where only some
* parts of the whole transaction succeeded, such as deleting external provider accounts without appropriately linking accounts
* and ensure that regardless of where the lambda trigger fails the rest of the actions will be attempted or rolled back somehow
* figure out how to possibly do that or ensure that this never takes more than 5 seconds or that we're alerted if it does at least
*
* Also note that this can't merge accounts from multiple external provider accounts if they sign up for multiple of those before
* signing up for a direct login account with Cognito - figure out what to do there, not really a problem in of itself just need to
* make sure we delete all the external providers linked to a single account if there are multiple by the time a user finally signs in directly with Cognito
*
* Also note that for some reason the PostLambda confirmation trigger sometimes, but not always, takes 4 seconds literally just to start up
* even if it's just printing a console.log(event);, which can cause a timeout to be very likely to happen at 5 seconds. Debug this hmm.
*/ 

exports.handler = async (event) => {
  console.log(event);
  
  const tryLinkingAccounts = async (resolve, reject) => {
    const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
  
    const userAttributes = event.request.userAttributes;
    console.log("userAttributes");
    console.log(event.request.userAttributes);
    const email = userAttributes.email; // note this could possibly be null in some SSO options, make sure it works okay in the case email isn't sent
    
    const paramsList = {
      Filter: `email = \"${email}\"`,
      Limit: 10,
      UserPoolId: event.userPoolId
    };

    let usersResult;
  
    try { // possible this will fail if there are no Users or will it always return a Users object
      usersResult = await cognitoidentityserviceprovider.listUsers(paramsList).promise();
      console.log("Users fetched successfully.");
      console.log(usersResult);
      if (usersResult.Users.length === 0) {
        return reject("No users fetched, big issue.");
      }
    }
    catch (err) {
      console.error("Error fetching users", err);
      return reject(err);
    }

    if (!usersResult) {
      return reject("No users fetched somehow.");
    }

    /**
    * this means it's an SSO sign in since only these will have identities attached to them
    * at the time of confirmation UNLESS users are changing their emails and reconfirming and
    * this is triggered, but the documentation seems to say this is specifically only triggered
    * when a new user signs up. New users signing up directly with email/pass with Cognito should
    * not have any identities on them, and thus not go through this flow, UNLESS we add some earlier
    * logic to add identities to these users for whatever reason, in which case this will break,
    * so make sure our tests cover those possible cases
    * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-post-confirmation.html
    */
    if (userAttributes.identities) {
      const identitiesObj = JSON.parse(userAttributes.identities);
      const socialID = identitiesObj[0].userId;    //extract social ID
      const providerName = identitiesObj[0].providerName;  //extract provider name 
  
      console.log("Identities found. Assuming external provider account.");
      console.log(identitiesObj);
  
      for (const user of usersResult.Users) {
        console.log("Current user in iteration");
        console.log(user);
        if (user.UserStatus === "CONFIRMED") {
          // this means it's a user directly signed up with email/pass - SSO users are
          // user.UserStatus === "EXTERNAL_PROVIDER"
          // if we found a user like this, delete the external provider account and link this
          // if we don't find one of these accounts, keep the external provider account
          console.log("Existing direct login account found! Checking if already linked...");

          for (const attr of user.Attributes) {
            if (attr.Name === "identities") { // this should exist after a successful adminLinkProviderForUser
              for (const identity of attr.Value) {
                if (identity.providerName === providerName) {
                  console.log("Some really weird thing happened and this account was already linked");
                  return reject("Account already linked");
                }
              }
            }
          }

          console.log("Not already linked. Commencing deletion of external provider account.");

          const paramsDelete = {
            UserPoolId: event.userPoolId, 
            Username: event.userName
          };

          try {
            await cognitoidentityserviceprovider.adminDeleteUser(paramsDelete).promise();
            console.log("External provider user successfully deleted", paramsDelete);
          }
          catch (err) {
            console.error("Error deleting external provider user", err);
            reject(err);
          }

          console.log("Attempting to link external provider to existing account");

          const paramsSSO = {
            DestinationUser: {
              ProviderAttributeName: '',
              ProviderAttributeValue: user.Username,
              ProviderName: 'Cognito'
            },
            SourceUser: { 
              ProviderAttributeName: 'Cognito_Subject',
              ProviderAttributeValue: socialID,
              ProviderName: providerName
            },
            UserPoolId: event.userPoolId 
          };

          try {
            await cognitoidentityserviceprovider.adminLinkProviderForUser(paramsSSO).promise();
            console.log("External provider account successfully linked!");
            return resolve("External provider linking successful");
          }
          catch (err) {
            console.error("Error linking external provider account", err);
            return reject(err);
          }
        }
      }
  
    } else { // this means the user signed up directly with Cognito, in this case see if any existing
      // external provider accounts made, search them by email match with ListUsers, and if they exist
      // delete those accounts and link them with this account just made right now
  
      // TODO
  
      console.log("User is a direct email/pass login user. Checking existing external providers to link.");

      for (const user of usersResult.Users) {
        console.log("Current user in iteration");
        console.log(user);
        if (user.UserStatus === "EXTERNAL_PROVIDER") {
          // if we found a user like this, delete the external provider account and link this
          // if we don't find one of these accounts, keep the external provider account
          console.log("Existing external provider account found - attempting to delete and link.");

          const username = user.Username;
          const [providerName, providerID] = user.Username.split('_');

          const paramsDelete = {
            UserPoolId: event.userPoolId, 
            Username: username
          };

          try {
            await cognitoidentityserviceprovider.adminDeleteUser(paramsDelete).promise();
            console.log("External provider user successfully deleted", paramsDelete);
          }
          catch (err) {
            console.error("Error deleting external provider user", err);
            return reject(err);
          }

          console.log("Attempting to link external provider to existing account");

          const paramsSSO = {
            DestinationUser: {
              ProviderAttributeName: '',
              ProviderAttributeValue: event.userName,
              ProviderName: 'Cognito'
            },
            SourceUser: {
              ProviderAttributeName: 'Cognito_Subject',
              ProviderAttributeValue: providerID,
              ProviderName: providerName
            },
            UserPoolId: event.userPoolId 
          };

          try {
            await cognitoidentityserviceprovider.adminLinkProviderForUser(paramsSSO).promise();
            console.log("External provider account successfully linked!");
          }
          catch (err) { // if this happens, real bad since existing external account already gone, account for this somehow
            console.error("Error linking external provider account, real bad because existing external account deleted now", err);
            return reject(err);
          }
        }
      }

      return resolve("Checked for all existing external providers to link and linked.");

    }
  };

  return new Promise(tryLinkingAccounts);
};

// exports.handler = (event, context, callback) => {
//   console.info("Event", JSON.stringify(event, null, 2));
//   console.log(event);
//   var cognitoISP = new AWS.CognitoIdentityServiceProvider();

//   //linking to SSO
//   var sso_params = {
//     DestinationUser: { /* required */
//       ProviderAttributeName: '',
//       ProviderAttributeValue: event.userName,
//       ProviderName: 'Cognito'
//     },
//     SourceUser: { /* required */
//       ProviderAttributeName: 'Cognito_Subject',
//       ProviderAttributeValue: '10221856219210543',
//       ProviderName: 'Facebook'
//     },
//     UserPoolId: event.userPoolId /* required */
//   };
  
//   cognitoISP.adminLinkProviderForUser(sso_params, function(err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else     console.log(data);           // successful response
//   });

//   // const signout_params = {
//   //   Username: event.userName,
//   //   UserPoolId: event.userPoolId
//   // }

//   // cognitoISP.adminUserGlobalSignOut(signout_params, function(err, data) {
//   //   if (err) { 
//   //     console.log(err, err.stack);
//   //   } // an error occurred
//   //   else { // successful response
//   //     console.log("User was successfully globally signed out");
//   //     console.log(data);
//   //   }       
//   // });
  
//   //updating custom attribute
//   var user_params = {
//     UserAttributes: [ /* required */
//         {
//           Name: 'custom:custom_attribute', /* required */
//           Value: '1234'
//         },
//         /* more items */
//       ],
//     UserPoolId: event.userPoolId, /* required */
//     Username: event.userName, /* required */
//   };

//   cognitoISP.adminUpdateUserAttributes(user_params, function(err, data) {
//   if (err) console.log(err, err.stack); // an error occurred
//   else     console.log(data);           // successful response
//   });
  
//   //returning event to Cognito
//   callback(null, event);
// };

// exports.handler = async (event, context, callback) => {
//   const cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
//   const groupParams = {
//     GroupName: process.env.GROUP,
//     UserPoolId: event.userPoolId,
//   };

//   const addUserParams = {
//     GroupName: process.env.GROUP,
//     UserPoolId: event.userPoolId,
//     Username: event.userName,
//   };

//   try {
//     await cognitoidentityserviceprovider.getGroup(groupParams).promise();
//   } catch (e) {
//     await cognitoidentityserviceprovider.createGroup(groupParams).promise();
//   }

//   try {
//     await cognitoidentityserviceprovider.adminAddUserToGroup(addUserParams).promise();
//     callback(null, event);
//   } catch (e) {
//     callback(e);
//   }
// };

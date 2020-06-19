/* eslint-disable-line */ const AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
  console.info("Event", JSON.stringify(event, null, 2));
  console.log(event);
  var cognitoISP = new AWS.CognitoIdentityServiceProvider();

  //linking to SSO
  var sso_params = {
    DestinationUser: { /* required */
      ProviderAttributeName: '',
      ProviderAttributeValue: 'event.userName',
      ProviderName: 'Cognito'
    },
    SourceUser: { /* required */
      ProviderAttributeName: 'Cognito_Subject',
      ProviderAttributeValue: '<FacebookUserID>',
      ProviderName: 'Facebook'
    },
    UserPoolId: event.userPoolId /* required */
  };
  
  cognitoISP.adminLinkProviderForUser(sso_params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
  
  //updating custom attribute
  var user_params = {
    UserAttributes: [ /* required */
        {
          Name: 'custom:custom_attribute', /* required */
          Value: '1234'
        },
        /* more items */
      ],
    UserPoolId: event.userPoolId, /* required */
    Username: event.userName, /* required */
  };

  cognitoISP.adminUpdateUserAttributes(user_params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
  });
  
  //returning event to Cognito
  callback(null, event);
};

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

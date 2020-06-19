exports.handler = async (event, context, callback) => {
  console.log("Event\n" + JSON.stringify(event, null, 2));
  const name = event['request']['userAttributes']['name'];
  let name_dec = 'Your name is not Ben Yu';
  if (name == "Ben Yu") {
    name_dec = 'Your name *is* Ben Yu';
  }
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        name_statement: name_dec,
      },
      claimsToSuppress: ['phone_number'],
    },
  };
  console.info("Event response\n" + JSON.stringify(event.response, null, 2));
  console.log(event.response);
  // Return to Amazon Cognito
  callback(null, event);
};

/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const languageStrings = {
  'en': require('./i18n/en'),
  'es': require('./i18n/es'),
  'de': require('./i18n/de')
}

const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest' ||
      (request.type === 'IntentRequest' &&
        (request.intent.name === 'GetNewFactIntent' ||
          request.intent.name === 'AMAZON.YesIntent'));
  },
  handle(handlerInput) {
    // we get the translator 't' function from the request attributes
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    const fact = isSlotFullfilled(handlerInput) ?
      getSpecificFact(handlerInput) :
      getRandomFact(requestAttributes.t('data'));

    const speechOutput = requestAttributes.t('GET_FACT_MESSAGE') +
      fact + requestAttributes.t('REPROMPT');

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(requestAttributes.t('SKILL_NAME'), fact)
      .reprompt(requestAttributes.t('REPROMPT'))
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('HELP_MESSAGE'))
      .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent' ||
        request.intent.name === 'AMAZON.NoIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('STOP_MESSAGE'))
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    console.log(`Error handled: ${error.message}`);
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('ERROR_MESSAGE'))
      .reprompt(requestAttributes.t('ERROR_MESSAGE'))
      .getResponse();
  },
};

const isSlotFullfilled = function (handlerInput) {
  return (handlerInput.requestEnvelope.request.intent &&
    handlerInput.requestEnvelope.request.intent.slots &&
    handlerInput.requestEnvelope.request.intent.slots.solarSystemMember &&
    handlerInput.requestEnvelope.request.intent.slots.solarSystemMember.value);
}

const getSpecificFact = function (handlerInput) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  const factArr = requestAttributes.t('data');
  const solarSystemMember = handlerInput.requestEnvelope.request.intent.slots.solarSystemMember.value;
  const filteredFacts = factArr.filter((element) => {
    return element.toLowerCase().indexOf(solarSystemMember.toLowerCase()) >= 0;
  });
  return getRandomFact(filteredFacts);
}

const getRandomFact = function (factArr) {
  const factIndex = Math.floor(Math.random() * factArr.length);
  const randomFact = factArr[factIndex];
  return randomFact;
}

const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      fallbackLng: 'en', // fallback to EN if locale doesn't exist
      resources: languageStrings
    });

    localizationClient.localize = function () {
      const args = arguments;
      let values = [];

      for (var i = 1; i < args.length; i++) {
        values.push(args[i]);
      }
      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: 'sprintf',
        sprintf: values
      });

      return value;
    }

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) { // pass on arguments to the localizationClient
      return localizationClient.localize(...args);
    };
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    // GetSpecificFactHandler,
    GetNewFactHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('./gatherer.js');
const pageFunctions = require('../../lib/page-functions.js');

/* eslint-env browser, node */


/**
 *  @param {HTMLFormElement} formElement
 *  @return {HTMLElement[] | { id: any; nodeName: any; name: any; placeholder: any; autocomplete: any; }[]}
 */
/* istanbul ignore next */
function getChildrenInputs(formElement) {
  /** @type {HTMLElement[] | { id: any; nodeName: any; name: any; placeholder: any; autocomplete: any; }[]} */
  const inputsArray = []; 
  const childrenArray = Array.prototype.slice.call(formElement.childNodes);
  
  childrenArray.map(  /** @param {HTMLElement} node */ (element) => {
    if (element.nodeName == 'INPUT' || element.nodeName == 'SELECT' || element.nodeName == 'TEXTAREA'){
      const inputAttributes = {
        id: element.id,
        nodeName: element.nodeName,
        name: element.name,
        placeholder: element.placeholder,
        autocomplete: element.autocomplete,
      }
      // @ts-ignore
      inputsArray.push(inputAttributes);
    }
  });
  
  return inputsArray;
}

/**
 *  @param {HTMLFormElement} formElement
 *  @return {HTMLElement[] | { id: any; nodeName: any; name: any; for: any; }[]}
 */
/* istanbul ignore next */
function getChildrenLabels(formElement) {
  const childrenArray = Array.prototype.slice.call(formElement.childNodes);
  /** @type {HTMLElement[] | { id: any; nodeName: any; name: any; for: any; }[]} */
  const labelsArray = [];
  childrenArray.map(/** @param {HTMLElement} node */ (element) => {
    if (element.nodeName == 'LABEL'){
      const labelAttributes = {
        id: element.id,
        nodeName: element.nodeName,
        name: element.name,
        for: element.for,
      }
      // @ts-ignore
      labelsArray.push(labelAttributes);
    }
  });

  return labelsArray;
}


/**
 * @return {LH.Artifacts['FormElements']}
 */
/* istanbul ignore next */
function collectFormElements() {

  // @ts-ignore
  const formElements = getElementsInDocument('form'); // eslint-disable-line no-undef
  // @ts-ignore
  const formChildren = getElementsInDocument('textarea', 'input', 'label', 'select'); // eslint-disable-line no-undef

  const formless = {
    inputs: [],
    labels: [],
  }
  formChildren.map( /** @param {HTMLElement} childElement */ (childElement) => {
    if (childElement.form) return;
    if (childElement.nodeName == 'INPUT' || childElement.nodeName == 'SELECT' || childElement.nodeName == 'TEXTAREA'){
      const inputAttributes = {
        id: childElement.id,
        nodeName: childElement.nodeName,
        name: childElement.name,
        placeholder: childElement.placeholder,
        autocomplete: childElement.autocomplete,
      }
      // @ts-ignore
      formless.inputs.push(inputAttributes);
    }

    else if (childElement.nodeName == 'LABEL'){
      const labelAttributes = {
        id: childElement.id,
        nodeName: childElement.nodeName,
        name: childElement.name,
        for: childElement.for,
      }
      // @ts-ignore
      formless.labels.push(labelAttributes);
    }
  });

  const forms = formElements.map(/** @param {HTMLFormElement} formElement */ (formElement) => {
    const form = {
      id: formElement.id,
      name:formElement.name,
      autocomplete:formElement.autocomplete,
    }

    return{
      form: form,
      inputs: getChildrenInputs(formElement),
      labels: getChildrenLabels(formElement),
    }
  });

  if (formless.inputs.length > 0 || formless.labels.length > 0){
    forms.push(formless);
  }
  return forms;
}

class FormElements extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<LH.Artifacts['FormElements']>}
   * @override
   */
  async afterPass(passContext) {
    const driver = passContext.driver;

    const expression = `(() => {
      ${getChildrenInputs.toString()};
      ${getChildrenLabels.toString()};
      ${pageFunctions.getOuterHTMLSnippetString};
      ${pageFunctions.getElementsInDocumentString};
      ${pageFunctions.isPositionFixedString};
      ${pageFunctions.getNodePathString};
      return (${collectFormElements})();

    })()`;

    /** @type {LH.Artifacts['FormElements']} */
    const formElements = await driver.evaluateAsync(expression, {useIsolation: true});
    return formElements;
  }
}

module.exports = FormElements;

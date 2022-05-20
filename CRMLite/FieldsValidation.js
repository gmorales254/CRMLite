//# sourceURL=FieldsValidation.js
import { paginate, array_move } from './Pagination.js';

export async function getStructure(table = 'CRMLite_structure', dsn = 'Repo',  channel = "telephony", campaign = "") {
  let fields = await UC_get_async(`SELECT * FROM ${table} WHERE active = 1 ORDER BY position`, dsn);
  fields = JSON.parse(fields);
  if(campaign){

    fields = fields.filter(element => element.optional == 0 || (element.optional == 1 && element.optCamps != "[]" &&  element.optCamps != "null" && JSON.parse(element.optCamps).includes(`${campaign}:${channel}`) ))
  
  }else{

    fields = fields.filter(element => element.optional == 0);
    
  }
  return fields;

}

export async function getFieldsInformationByParam(searchBy = "phone", val = "") {
  let fieldsInfo
  if (searchBy === "id" || searchBy === "phone" || searchBy === "email" || searchBy === "name") {
    fieldsInfo = await UC_get_async(
      `SELECT * FROM CRMLite_customersV2 
    WHERE ${searchBy} = "${val}"`,
      'Repo');
  } else {
    fieldsInfo = await UC_get_async(
      `SELECT * FROM CRMLite_customersV2 
    WHERE information->>"$.${searchBy}" = "${val}"`,
      'Repo');
  }
  return fieldsInfo = JSON.parse(fieldsInfo);

}

export async function insertFieldsConvertedToHTML(arrFields = [/*resultado de getStructure()*/], maxColumns = 3) {

  if (!arrFields.length) return { error: "Invalid array without elements" }
  let fieldsHTML = "";// HTML Elements
  let countArr = arrFields.length;

  // usamos paginado para determinar que cantidad de campos va en cada columna
  let columnsDistribution = paginate(
    arrFields.length, // cantidad de elementos.
    1,
    Math.ceil(countArr / maxColumns), // Ej: 15 elementos dividido entre 3 columnas, el total, lo redondeo hacia arriba.
    maxColumns // 3 por default.
  );


  //distribucion de columnas:
  let arrDistribution = [];
  let arrFieldsPerColumn = [];

  for (let i = 1; i <= columnsDistribution.totalPages; i++) { // recorro todas las páginas
    let respPaginate = paginate(
      arrFields.length, // cantidad de elementos.
      i,
      Math.ceil(countArr / maxColumns), // Ej: 15 elementos dividido entre 3 columnas, el total, lo redondeo hacia arriba.
      maxColumns // 3 por default.
    );

    arrDistribution.push(respPaginate); //guardo en mi array por columna

    let arrFieldsTEMP = [];
    for (let x = respPaginate.startIndex; x <= respPaginate.endIndex; x++) {
      arrFieldsTEMP.push(arrFields[x]);
    }

    arrFieldsPerColumn.push(arrFieldsTEMP); // pusheo array que contiene de X index a X index los elementos de arrFields.
  }



  //

  for (let i = 0; i < arrDistribution.length; i++) {

    let templateInputHTML = "";

    arrFieldsPerColumn[i].map(field => {
      let arrIcons = [
        { name: "phone", icon: "fa fa-phone" },
        { name: "text", icon: "fa fa-file" },
        { name: "name", icon: "glyphicon glyphicon-user" },
        { name: "email", icon: "glyphicon glyphicon-envelope" }
      ];
      let icon = "";


      //'text','number','select','boolean','checkbox','email','phone','timestamp','name'
      if (field.fieldType === "select") {

        let selectValues = [];
        let selectValuesHTML = '';
        selectValues = field.fieldValue.split(',');
        selectValues.map(item => selectValuesHTML += `<option value="${item}">${item}</option>`);

        templateInputHTML += `
        <div class="inputs fvalidation__inputs">
      <span class="label">${field.name}</span>
                <select class="combobox-ui" data-fieldid="${field.fieldId}" ${field.required ? "required" : ""} title="${field.name}">
                  <option disabled="true" selected="true" value="">${field.name}</option>
                  ${selectValuesHTML}
				    	  </select>
				</div>
        `;
      } else if (field.fieldType === "boolean") {
        templateInputHTML += `
        <div class="inputs fvalidation__inputs">
        <span  class="label">${field.name}</span>
                <select class="combobox-ui" data-fieldid="${field.fieldId}" ${field.required ? "required" : ""} title="${field.name}">
                  <option disabled="true" selected="true" value="">${field.name}</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
				    	  </select>
				</div>
        `;
      } else if (field.fieldType === "checkbox") {
        templateInputHTML += `
      <div class="inputs fvalidation__inputs">
      <span class="label">${field.name}</span>
    <div class="input-group">
      <span class="input-group-addon">
        <input type="checkbox" aria-label="..." data-fieldid="${field.fieldId}">
      </span>
      <input type="text" class="form-control" aria-label="..." disabled="" placeholder="${field.name}" title="${field.name}">
    </div>
  </div>
      `;

      } else if (field.fieldType === "timestamp") {
        templateInputHTML += `
          <div class="inputs fvalidation__inputs">
          <span class="label">${field.name}</span>
							<div style="">
								<input class="combobox-ui" type="datetime-local" placeholder="${field.name}" data-fieldid="${field.fieldId}" title="${field.name}">
							</div>
						</div>
            `;
      } else {

        icon = arrIcons.filter(element => element.name === field.fieldType); // Busco icono por tipo de campo
        if (!icon.length) icon = arrIcons.filter(element => element.name === "text");
        icon = icon[0].icon;

        templateInputHTML += `
      <div class="inputs">
          <span class="label fvalidation__inputs">${field.name}</span>
								<div class="input-group">
                      <span class="input-group-addon ${field.fieldType === "phone" ? "phoneAddon" : ""}" 
                      id="basic-addon1" ${field.fieldType === "phone" && `data-phoneid="${field.fieldId}"`} title="${field.name}">            
								        <i class="${icon}"></i>
							        </span>
									<input type="${field.fieldType === "number" ? "number" : "text"}" class="form-control" name="${field.name}" placeholder="${field.name}" data-fieldid="${field.fieldId}"
                  aria-describedby="basic-addon1" data-toggle="tooltip" title="${field.name}" data-original-title="${field.name}" ${field.required ? "required" : ""}>
							</div>
			</div>
      `;
      }

    });

    let column = arrDistribution[i].currentPage;
    document.getElementById(`col-${column}`).innerHTML = templateInputHTML;
  }
  return true;

}

export function insertFieldsInformation(objInformation = {}, structure = [{}], phone = 0, email = "", name = "") {

      objInformation.phone = phone;
      objInformation.email = email;
      objInformation.name = name;
      

  if (!objInformation || !structure.length) return { error: "Dont found information for insert" };

  structure = structure.filter(e => e.fieldId != "phone" || e.fieldId != "name" || e.fieldId != "email");
  structure.forEach(field => {
    let id = field.fieldId;
    let fieldDom = document.querySelector(`[data-fieldid="${id}"]`);
    //'text','number','select','boolean','checkbox','email','phone','timestamp','name'
    if (objInformation[id]){

      if (field.fieldType === "checkbox") fieldDom.checked = objInformation[id];
      if (field.fieldType === "timestamp") fieldDom.value = moment(objInformation[id]).format('YYYY-MM-DDTHH:mm');
      else fieldDom.value = objInformation[id];

    }
  });


  return true;

}


export function manualFormValidation(arrElements = []) {

  const expresiones = {
    text: /^[a-zA-ZÀ-ÿ\s]{1,40}$/, // Letras y espacios, pueden llevar acentos.
    email: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, // correo
    phone: /^\d{7,13}$/, // 7 a 13 numeros
    num: /^[0-9]+$/,
    alphanumeric: /^[a-zA-ZÀ-ÿ0-9\s!/.,^()';&%$#-_=:@]+$/, //alfanumerico
    date: new RegExp(`^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,2}T[0-9]{1,2}:[0-9]{1,2}$`)
  };
  //EJ.: arrElements = [{}]

  if (!arrElements.length) {
    console.log('No hay array de elementos a validar');
    return { error: "without elements" };
  }

  let fields = {};

  arrElements.map((element) => {
    let id = element.fieldId; // identificador del campo
    let fieldType = element.fieldType; //tipo de campo
    let fieldReq = element.required; // tomo el  required y convierto de string a boolean
    let fieldDom = document.querySelector(`[data-fieldid='${id}']`);
    let expresion = '';

    //'text','number','select','boolean','checkbox','email','phone','timestamp','name'
    switch (fieldType) {

      case "phone":
        expresion = expresiones.phone;
        break;

      case "name":
        expresion = expresiones.alphanumeric;
        break;

      case "timestamp":
        expresion = expresiones.date;
        break;

      case "email":
        expresion = expresiones.email;
        break;

      case "text":
        expresion = expresiones.alphanumeric;
        break;

      case "number":
        expresion = expresiones.num;
        break;

      default:
        expresion = expresiones.alphanumeric;
        break;

    }

    fieldValidation(expresion, fieldDom, id, fieldReq);

  });

  function fieldValidation(expresion, input, campo, required) {
    if (required === false && !input.value) {
      input.classList.remove("input-error");
      input.classList.add("input-correcto");
      fields[campo] = true;
    } else {
      if (expresion.test(input.value)) {
        input.classList.remove("input-error");
        input.classList.add("input-correcto");
        fields[campo] = true;
      } else {
        input.classList.remove("input-correcto");
        input.classList.add("input-error");
        fields[campo] = false;
      }

    }
  }

  return !Object.values(fields).includes(false); // verificamos que ningún campo esté mal y retornamos resultado (true, false).
}


export function parseInformationToObj(arrStructure = [{}]) {

  if (!arrStructure.length) return { error: "Dont found information" };

  let formatedFieldsInfo = {
    id: null,
    agent: parent.agent.accountcode,
    active: 1,
    information: '',
    phone: document.querySelector(`[data-fieldid="phone"]`).value,
    email: document.querySelector(`[data-fieldid="email"]`).value,
    name: document.querySelector(`[data-fieldid="name"]`).value,
    files: null
  }

  let fieldsObj = {};

  arrStructure.map(element => {
    //objstringlify
    const {fieldId, fieldType, active} = element;
    let fieldDOM;
    if (active == true && (fieldId != "phone" && fieldId != "email" && fieldId != "name")) {
      fieldDOM = document.querySelector(`[data-fieldid="${fieldId}"]`);
      fieldsObj[fieldId] = fieldType === "checkbox" ? fieldDOM.checked : fieldDOM.value;
    }
  });

  formatedFieldsInfo.information = JSON.stringify(fieldsObj);

  return formatedFieldsInfo;
}




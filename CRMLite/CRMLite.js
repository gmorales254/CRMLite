//# sourceURL=CRMLite.js
preBindTab(null); //Don't delete this line
//Documentation for devs by devs:
//https://www.notion.so/CRMLite-dev-s-manual-6457517922e841dea181425934739e99
//How to use manual:
//https://www.notion.so/How-to-use-CRMLite-0b3741ef947e46d2a7e6b575647161a7

//CONFIGURATION CONST:
const config = {
  defaultPreview: 'CRMLite_Scheduler->', //for scheduled calls
  fieldsCmb: {
    cmb1: ['default'],
    cmb2: ['default']
  },
  fieldsLabel: {
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    field5: ''
  },
  closeForm: {
    active: false,
    timeInMs: 300000
  },
  historyLimit: 5,
  saveWithoutDispo: true,
  inpts: ['txtName', 'txtDocument', 'txtAddress', 'txtEmail',
    'txtCity', 'txtCountry', 'txtColony', 'txtField1', 'txtField2',
    'txtField3', 'cmbField4', 'cmbField5', 'txtCp', 'txtPhone', 'txtState'],
  attendTransfer: true
};



var language = parent.language;
var options = {
  lng: language,
  resGetPath: "translation_" + language + ".json"
};

i18n.init(options, function (t) {
  $("body").i18n();
  init();
});


//Variables globables:
var fileArray = [];
var GUID = "";
var hayMasTipificaciones = true;
var globalaction = "";
var customerFound = '';
var callid = '';


// REACT FORM VALIDATOR ACÁ... /////////////////////////////////////////////////////////////////

const reactform = document.getElementById('reactform');
const inputs = document.querySelectorAll('#reactform input');

const expresiones = {
  texto: /^[a-zA-ZÀ-ÿ\s]{1,40}$/, // Letras y espacios, pueden llevar acentos.
  correo: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, // correo
  telefono: /^\d{7,13}$/, // 7 a 13 numeros
  doc: /^\d{4,13}$/, // 7 a 13 numeros
  cp: /^\d{3,5}$/, // 3 a 5 numeros.
  alphanumeric: /^[a-zA-Z0-9_\s]*$/ //alfanumerico
}
const fields = {
  txtDocument: false,
  txtName: false,
  txtPhone: false,
  txtEmail: false,
  txtAddress: true,
  txtColony: true,
  txtCp: true,
  txtCity: true,
  txtState: true,
  txtCountry: true,
  txtField1: true,
  txtField2: true,
  txtField3: true
}

const formValidation = async (e) => {
  switch (e.target.name) {
    case "document":
      fieldValidation(expresiones.doc, e.target, 'txtDocument', false);
      break;
    case "name":
      fieldValidation(expresiones.texto, e.target, 'txtName', true);
      break;
    case "email":
      fieldValidation(expresiones.correo, e.target, 'txtEmail', true);

      let respi = JSON.parse(await UC_get_async(`SELECT id_customer FROM ccrepo.CRMLite_customers WHERE email = "${e.target.value}" LIMIT 1`, ""));
      if (respi && respi[0].id_customer != customerFound) {

        swal("We found a customer with this same email",
          "To use this email you most to load the contact information",
          {
            buttons: {
              cancel: true,
              confirm: "Confirm"
            },
            closeOnClickOutside: false,
          }).then((res) => {
            if (res) {
              loadCustomer(respi[0].id_customer);
            } else {
              e.target.value = "";
            }
          });

      }
      break;

    case "phone":
      fieldValidation(expresiones.telefono, e.target, 'txtPhone', true);
      let resp = JSON.parse(await UC_get_async(`SELECT id_customer FROM ccrepo.CRMLite_customers WHERE phone = "${e.target.value}" LIMIT 1`, ""));
      if (resp && resp[0].id_customer != customerFound) {

        swal("We found a customer with this phone",
          "To use this number you most to load the contact information",
          {
            buttons: {
              cancel: true,
              confirm: "Confirm"
            },
            closeOnClickOutside: false,
          }).then((res) => {
            if (res) {
              loadCustomer(resp[0].id_customer);
            } else {
              e.target.value = "";
            }
          });

      }

      break;
    case "address":
      fieldValidation(expresiones.alphanumeric, e.target, 'txtAddress', false);
      break;
    case "colony":
      fieldValidation(expresiones.texto, e.target, 'txtColony', false);
      break;
    case "cp":
      fieldValidation(expresiones.cp, e.target, 'txtCp', false);
      break;
    case "city":
      fieldValidation(expresiones.texto, e.target, 'txtCity', false);
      break;
    case "state":
      fieldValidation(expresiones.texto, e.target, 'txtState', false);
      break;
    case "country":
      fieldValidation(expresiones.texto, e.target, 'txtCountry', false);
      break;
  }
}

const fieldValidation = (expresion, input, campo, required) => {

  if (required === false && !input.value) {
    document.getElementById(campo).classList.remove('input-error');
    document.getElementById(campo).classList.add('input-correcto');
    fields[campo] = true;
  } else {

    if (expresion.test(input.value)) {
      document.getElementById(campo).classList.remove('input-error');
      document.getElementById(campo).classList.add('input-correcto');
      fields[campo] = true;
    } else {
      document.getElementById(campo).classList.remove('input-correcto');
      document.getElementById(campo).classList.add('input-error');
      fields[campo] = false;
    }

  }

}


inputs.forEach((input) => {
  input.addEventListener('keyup', formValidation);
  input.addEventListener('blur', formValidation);
});

function manualFormValidation() {

  fieldValidation(expresiones.doc, document.getElementById('txtDocument'), 'txtDocument', false);
  fieldValidation(expresiones.texto, document.getElementById('txtName'), 'txtName', true);
  fieldValidation(expresiones.correo, document.getElementById('txtEmail'), 'txtEmail', true);
  fieldValidation(expresiones.telefono, document.getElementById('txtPhone'), 'txtPhone', true);
  fieldValidation(expresiones.alphanumeric, document.getElementById('txtAddress'), 'txtAddress', false);
  fieldValidation(expresiones.texto, document.getElementById('txtColony'), 'txtColony', false);
  fieldValidation(expresiones.cp, document.getElementById('txtCp'), 'txtCp', false);
  fieldValidation(expresiones.texto, document.getElementById('txtCity'), 'txtCity', false);
  fieldValidation(expresiones.texto, document.getElementById('txtState'), 'txtState', false);
  fieldValidation(expresiones.texto, document.getElementById('txtCountry'), 'txtCountry', false);

}


async function ReactcheckValidity() {
  return !Object.values(fields).includes(false);
}

// FORM REACT FINISH..............


// SEARCH 
document.getElementById('btnSearch').addEventListener('click', async () => {
  if (!document.getElementById('txtSearch').value) {
    notification('Warning', "The input is empty", "fa fa-warning", "warning");
    return null;
  }

  let resp = await loadCustomer(document.getElementById('txtSearch').value, true);
  if (resp != 0) {
    swal("Great news",
      `The customer ${resp.name} can be loaded`,
      {
        buttons: {
          cancel: true,
          confirm: "Load it for me!"
        },
        closeOnClickOutside: false,
      }).then((res) => {
        if (res) {
          loadCustomer(resp.id_customer);
        }
      });

  } else {
    swal("We don't found the customer",
      "try again with another params", {
        buttons: {
          cancel: true,
          confirm: "Thanks"
        }
      });
  }
});



// SAVE
document.getElementById('btnSave').addEventListener('click', async () => {
  manualFormValidation();

  if (!hayMasTipificaciones) {

    if (!config.saveWithoutDispo || config.saveWithoutDispo && callid || !customerFound) {
      let resp = await saveContactInfo();
      if (resp === false) {
        return false;
      }
    }

    if (globalaction === 'BLACKLIST') {
      await addToBlacklist();
    } else if (globalaction === 'RESCHEDULE') {

      if (!document.getElementById('dateframe').value) {
        notification('Sorry', 'please, choose a date for schedule', 'fa fa-warning', 'warning');
        return;
      }
      await makeReschedule();

    }

    let campana = document.getElementById('cmbCampaign').value.split(' ')[0];
    let can = document.getElementById('cmbCampaign').value.split(' ')[1];
    let canal = can.substring(1, can.length - 1);


    if (GUID) {
      let tag = '';
      if (document.getElementById('cmbRes1').value) tag = document.getElementById('cmbRes1').value;
      if (document.getElementById('cmbRes2').value) tag += "|" + document.getElementById('cmbRes2').value;
      if (document.getElementById('cmbRes3').value) tag += "|" + document.getElementById('cmbRes3').value;
      let objSave = new Object();
      objSave.channel = canal;
      objSave.dateprocessed = moment().format("YYYY-MM-DD HH:mm:ss");
      objSave.agent = parent.userid;
      objSave.value1 = document.getElementById('cmbRes1').value;
      objSave.value2 = document.getElementById('cmbRes2').value;
      objSave.value3 = document.getElementById('cmbRes3').value;
      objSave.guid = GUID;
      objSave.campaign = campana;
      objSave.comment = document.getElementById('txtNote').value;
      objSave.data1 = "callid: " + callid;
      objSave.data2 = "";
      objSave.callerid = document.getElementById('txtPhone').value;
      let guardado = await UC_Save_async(objSave, "ccrepo.dispositions_repo", "");

      UC_TagRecord(GUID, tag);

      if (guardado !== "OK") {
        notification("Bad request", "Ups! It's me, not you. Try again", 'fa fa-times', 'danger');
        return;
      }

    }

    // manejo de las dispositions sobre CRMLite_management >

    let cliente = await loadCustomer(document.getElementById('txtPhone').value, true);

    let objMang = {
      id_customer: cliente.id_customer,
      date: moment().format("YYYY-MM-DD HH:mm:ss"),
      agent: parent.agent.accountcode,
      lvl1: document.getElementById('cmbRes1').value,
      lvl2: document.getElementById('cmbRes2').value,
      lvl3: document.getElementById('cmbRes3').value,
      note: document.getElementById('txtNote').value,
      queuename: campana,
      channel: canal,
      guid: GUID,
      callid: callid
    }

    let ress = await UC_Save_async(objMang, 'CRMLite_management', '');

    if (ress === "OK") {

      notification('Congratulation!', '', 'fa fa-success', 'success');
      UC_closeForm();

    }
  } else {
    notification("Disposition", "The disposition is not completed", 'fa fa-times', 'danger');
  }

});

document.getElementById('btnContactSave').addEventListener('click', async () => {
  manualFormValidation();
  let resp = await saveContactInfo();
  if (resp) {
    UC_closeForm();
  }
})


//Save contacto info ()
async function saveContactInfo() {

  if (await ReactcheckValidity()) {

    //parseo mi array de archivos a una cadena de string sola para guardar en la base:
    let fileArrayParse = "";
    if (fileArray.length) {
      fileArray.map((item, pos, comp) => {
        fileArrayParse += item;
        if (pos < comp.length - 1) fileArrayParse += "|";
      });

    }
    //............................................................................

    const customerData = {
      id_customer: customerFound ? customerFound : null,
      document: document.getElementById("txtDocument").value,
      name: document.getElementById("txtName").value,
      phone: document.getElementById("txtPhone").value,
      email: document.getElementById("txtEmail").value,
      address: document.getElementById("txtAddress").value,
      colony: document.getElementById("txtColony").value,
      cp: document.getElementById("txtCp").value,
      city: document.getElementById("txtCity").value,
      state: document.getElementById("txtState").value,
      country: document.getElementById("txtCountry").value,
      field1: document.getElementById("txtField1").value,
      field2: document.getElementById('txtField2').value,
      field3: document.getElementById("txtField3").value,
      field4: document.getElementById("cmbField4").value,
      field5: document.getElementById("cmbField5").value,
      files: fileArrayParse,
      active: 1,
      agent: parent.userid,
      date: moment().format('YYYY-MM-DD hh:mm:ss')
    }

    if (customerFound) { //debo actualizar
      let resp = UC_update_async(customerData, 'CRMLite_customers', 'id_customer', '');
      console.log("updated response: " + resp);
    } else { //genero este usuario como nuevo
      let resp = UC_Save_async(customerData, 'CRMLite_customers', '');
      console.log("saved response: " + resp);
    }



    notification('Congrats!', "The contact information was save", "fa fa-success", "success")
    return true;

  } else {
    notification('Warning', "The form is not complete or valid at all", "fa fa-warning", "warning");
    return false;
  }
}

//TRANSFER:

document.getElementById('attendTransferAddon').addEventListener('click', async () => {
  let numeroLlamada = callid;
  let agentto = document.getElementById('txtExten').value;
  if (agentto && !!numeroLlamada) {
    let resp = await UC_exec_async(`INSERT INTO ccrepo.CRM_temp (agentFrom, agentto, callerId) 
		VALUES ('${parent.agent.name}', '${agentto}', '${numeroLlamada}')`, '');

    if (resp == "OK") {
      parent.__SendDTMF(`#0${agentto}`);
    }

  }
})


//makeReschedule
async function makeReschedule() {
  if (document.getElementById('dateframe').value) {
    let callerid = document.getElementById('txtPhone').value;
    let querypart = `WHERE destination like '%${document.getElementById('txtPhone').value}%' OR (alternatives <> '' 
      AND (alternatives like '%${document.getElementById('txtPhone').value}%' 
      OR alternatives like '%${document.getElementById('txtPhone').value}%'))`;

    let queryC = `DELETE FROM ccdata.calls_spool ${querypart}`;
    let queryS = `DELETE FROM ccdata.calls_scheduler ${querypart}`;
    await UC_exec_async(queryC, '');
    await UC_exec_async(queryS, '');

    let resp = await UC_exec_async(`INSERT INTO ccdata.calls_scheduler (id, calldate, campaign, destination, agentphone) VALUES(null, 
                '${moment(document.getElementById('dateframe').value).format('YYYY-MM-DD hh:mm:ss')}', 
                '${config.defaultPreview}', '${callerid}', ${parent.agent.name})`, '');
  }
}

// BLACKLIST Add
async function addToBlacklist() {
  let objeto = new Object();
  objeto.phone = document.getElementById('txtPhone').value;
  objeto.campaign = '*';
  objeto.username = parent.userid;
  objeto.lastchaged = moment().format("YYYY-MM-DD HH:mm:ss");

  let querypart = `WHERE destination like '%${document.getElementById('txtPhone').value}%' OR (alternatives <> '' 
    AND (alternatives like '%${document.getElementById('txtPhone').value}%' OR alternatives like '%${document.getElementById('txtPhone').value}%'))`;
  let queryC = `DELETE FROM ccdata.calls_spool ${querypart}`;
  let queryS = `DELETE FROM ccdata.calls_scheduler ${querypart}`;
  await UC_exec_async(queryC, '');
  await UC_exec_async(queryS, '');
  UC_Save(objeto, 'ccdata.black_list', '', () => audit(`The user ${parent.userid} insert ${document.getElementById('txtPhone').value} to BlackList`));

}


//Limpiar todos los fields del react form o eliminar el usuario en caso de encontrarlo>
document.getElementById('btnClean').addEventListener('click', async () => {
  if (!customerFound) {
    reactform.reset();
  } else {
    swal(i18n.t("CRMLite.warning"), i18n.t("CRMLite.sureDelete"), 'warning', {
      buttons: {
        cancel: true,
        confirm: "Confirm"
      }
    }).then(async (res) => {
      if (res) {
        let resp = await UC_exec_async(`DELETE FROM CRMLite_customers WHERE id_customer = ${customerFound}`, '');
        let respi = await UC_exec_async(`DELETE FROM CRMLite_management WHERE id_customer = ${customerFound}`, '');
        if (resp == "OK") {
          swal(i18n.t("CRMLite.congrats"), i18n.t("CRMLite.deleteCustomerOk"), 'success');
          reactform.reset();
          UC_closeForm();
        } else {
          swal('Ups!', i18n.t("CRMLite.operationError"), 'warning');
        }
      }

    })
  }
})

//Realizar llamadas con el boton del icono phone >
document.getElementById('phoneAddon').addEventListener('click', () => {
  if (!document.getElementById('txtPhone').value) {
    notification('Ups!', i18n.t("CRMLite.phoneEmpty"), 'fa fa-warning', 'warning');
  } else {
    UC_makeCall_async("", "", Number(document.getElementById('txtPhone').value))
  }
})


//Agregar un archivo de tipo link
document.getElementById('bdgNewfile').addEventListener('click', () => {
  swal({
    title: "Add a new link to your file step: 1/2",
    content: {
      element: "input",
      attributes: {
        placeholder: "Type the file name with extension ('Document.pdf')",
        type: "text",
        id: 'inpDocName',
        required: true
      },
    },
    buttons: {
      cancel: true,
      confirm: "Confirm"
    },
    closeOnClickOutside: false,
  }).then((urlname) => {

    if (urlname) {
      swal({
        title: "Add a new link to your file (URL), step: 2/2",
        content: {
          element: "input",
          attributes: {
            placeholder: "Paste here the file URL",
            type: "text",
            id: 'inpUrlDoc'
          },
        },
        buttons: {
          cancel: true,
          confirm: "Confirm"
        },
        closeOnClickOutside: false,
      }).then((urlpath) => {


        let expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        let regexUrl = new RegExp(expression);

        if (urlpath && regexUrl.test(urlpath.replace(/ /g, ""))) {
          loadFiles(`${urlname.replace(/ /g, "")}>${urlpath.replace(/ /g, "")}`); //le quito los espacios y lo mando
        } else {
          swal({
            title: 'The URL is invalid, please, check again'
          })
          return;
        }

      });
    } else {
      swal({
        title: 'You dont type the file name'
      })
      return;
    }

  });
})

// Funcion inicial >>
//Oculto elementos que no se utilizaran hasta el momento de cargar todo>
async function init() {

  reactform.reset();
  document.getElementById('dateframe').min = moment().format('YYYY-MM-DDThh:mm');
  //config para cerrar el form despues de X tiempo
  if (config.closeForm.active) {
    setTimeout(() => {
      UC_closeForm();
    }, config.closeForm.timeInMs)
  }

  document.getElementById('datediv').style.display = 'none';
  document.getElementById("cntHistory").style.display = 'none';
  document.getElementById("tblSearch").style.display = 'none';
  document.getElementById("btnContactSave").style.display = 'none';
  document.querySelector('#trasnferinput').style.display = 'none';

  let fieldsLabel = config.fieldsLabel;
  if (fieldsLabel.field1) document.getElementById('lblField1').innerText = fieldsLabel.field1;
  if (fieldsLabel.field2) document.getElementById('lblField2').innerText = fieldsLabel.field2;
  if (fieldsLabel.field3) document.getElementById('lblField3').innerText = fieldsLabel.field3;
  if (fieldsLabel.field4) document.getElementById('lblField4').innerText = fieldsLabel.field4;
  if (fieldsLabel.field5) document.getElementById('lblField5').innerText = fieldsLabel.field5;


  if (config.saveWithoutDispo === true && !CTI) {
    document.getElementById("btnContactSave").style.display = 'block';
  }

  if (config.attendTransfer === true) {
    document.querySelector('#trasnferinput').style.display = 'block';
  }

  $('#cmbField4').empty();
  $("#cmbField4").trigger("chosen:updated");
  $('#cmbField4').prepend("<option disabled selected value>Select an option..</option>");
  config.fieldsCmb.cmb1.map((item) => $('#cmbField4').append(new Option(item, item)));
  $("#cmbField4").trigger("chosen:updated");

  $('#cmbField5').empty();
  $("#cmbField5").trigger("chosen:updated");
  $('#cmbField5').prepend("<option disabled selected value>Select an option..</option>");
  config.fieldsCmb.cmb2.map((item) => $('#cmbField5').append(new Option(item, item)));
  $("#cmbField5").trigger("chosen:updated");

  await loadCampaigns();

  if (CTI && JSON.parse(CTI).Channel) {
    // Canales disponibles: 
    // messenger (callerid numero interaccion de fb), 
    // webchat (callerid > correo),
    // sms (caller > celular),
    // email (callerid > email).

    let CTIParse = JSON.parse(CTI);

    if (CTIParse.Channel === "email" || CTIParse.Channel === "webchat") {
      if (CTIParse.Channel === "email") {

        document.getElementById('txtEmail').value = CTIParse.Callerid
        GUID = CTIParse.Guid;
        document.getElementById('cmbCampaign').value = `${CTIParse.Campaign} (email)`;
        document.getElementById('cmbCampaign').disabled = true;
        completarD1();
        callid = CTIParse.Callerid
      } else {

        document.getElementById('txtEmail').value = CTIParse.Callerid
        GUID = CTIParse.Guid;
        document.getElementById('cmbCampaign').value = `${CTIParse.Campaign} (webchat)`;
        document.getElementById('cmbCampaign').disabled = true;
        completarD1();
        callid = CTIParse.Callerid
      }
      await loadCustomer(CTIParse.Callerid);
    } else if (CTIParse.Channel === "sms") {

      document.getElementById('txtPhone').value = CTIParse.Callerid
      GUID = CTIParse.Guid;
      document.getElementById('cmbCampaign').value = `${CTIParse.Campaign} (sms)`;
      document.getElementById('cmbCampaign').disabled = true;
      completarD1();
      callid = CTIParse.Callerid

      await loadCustomer(CTIParse.Callerid);
    } else {
      GUID = CTIParse.Guid;
      document.getElementById('cmbCampaign').value = `${CTIParse.Campaign} (messenger)`
      document.getElementById('cmbCampaign').disabled = true;
      completarD1();
      callid = CTIParse.Callerid
      notification('Hey!', "We can't load the contact information from messenger, search it by phone or email.", 'fa fa-warning', 'warning');
    }

  } else if (CTI) {
    //Canal de llamada
    let CTIParse = JSON.parse(CTI);

    document.getElementById('txtPhone').value = CTIParse.Callerid
    GUID = CTIParse.Guid;
    console.log(`${CTIParse.Campaign} (telephony)`);

    document.getElementById('cmbCampaign').value = `${CTIParse.Campaign} (telephony)`
    document.getElementById('cmbCampaign').disabled = true;
    completarD1();
    await loadCustomer(CTIParse.Callerid);

    callid = CTIParse.Callerid;

    if (CTIParse.ParAndValues) {
      let ParAndValuesArray = CTIParse.ParAndValues.split(':')
      ParAndValuesArray.map((item) => {

        let parval = item.split('=')
        if (config.inpts.includes(parval[0])) {
          document.getElementById(`${parval[0]}`).value = `${parval[1]}`;
        } else {

        }

      });
    }
  } else {
    //Sin interaccion
    console.log("Sin interaccion activa");
    document.getElementById('cmbCampaign').disabled = false;
    callid = ""
  }


}

//Carga de todas las campañas:
async function loadCampaigns() {
  let campaigns = [];
  //telefonia
  let channelCall = JSON.parse(await UC_getMyAgentCampaigns_async())
  if (channelCall.length) channelCall.map((item) => campaigns.push(`${item} (telephony)`));
  //email
  let channelEmail = JSON.parse(await UC_get_async(`SELECT name FROM ccdata.email_members WHERE agent = '${parent.agent.accountcode}'`))
  if (channelEmail.length) channelEmail.map((item) => campaigns.push(`${item.name} (email)`));
  //messenger
  let channelMessenger = JSON.parse(await UC_get_async(`SELECT name FROM ccdata.messenger_members WHERE agent = '${parent.agent.accountcode}'`))
  if (channelMessenger.length) channelMessenger.map((item) => campaigns.push(`${item.name} (messenger)`));
  //sms
  let channelSms = JSON.parse(await UC_get_async(`SELECT name FROM ccdata.sms_members WHERE agent = '${parent.agent.accountcode}'`))
  if (channelSms.length) channelSms.map((item) => campaigns.push(`${item.name} (sms)`));
  //Webchat
  let channelWeb = JSON.parse(await UC_get_async(`SELECT name FROM ccdata.webchat_members WHERE agent = '${parent.agent.accountcode}'`))
  if (channelWeb.length) channelWeb.map((item) => campaigns.push(`${item.name} (webchat)`));

  //cargo los datos recogidos:
  $('#cmbCampaign').empty();
  $("#cmbCampaign").trigger("chosen:updated");
  $('#cmbCampaign').prepend("<option disabled selected value>Select a campaign..</option>");
  campaigns.map((item) => $('#cmbCampaign').append(new Option(item, item)));
  $("#cmbCampaign").trigger("chosen:updated");
}

//Carga tipificaciones:

document.getElementById('cmbCampaign').addEventListener('change', async () => {

  $('#cmbRes1').empty();
  $('#cmbRes2').empty();
  $('#cmbRes3').empty();
  document.getElementById('datediv').style.display = 'none';

  await completarD1();
});

async function completarD1() {
  let campana = document.getElementById('cmbCampaign').value.split(' ')[0];
  let can = document.getElementById('cmbCampaign').value.split(' ')[1];
  let canal = can.substring(1, can.length - 1);

  let resp = await UC_get_async(`SELECT distinct value1 FROM ccdata.dispositions WHERE campaign = '${campana}' AND channel = '${canal}'`, '');
  let respuesta = JSON.parse(resp);
  if (respuesta[0].value1.length > 0) {
    $('#cmbRes1').empty();
    $("#cmbRes1").trigger("chosen:updated");
    $('#cmbRes1').prepend("<option disabled selected value>Select a disposition</option>");
    respuesta.map((item) => $('#cmbRes1').append(new Option(item.value1, item.value1)));
    $("#cmbRes1").trigger("chosen:updated");
  }
}

$('#cmbRes1').change(async () => {
  let campana = document.getElementById('cmbCampaign').value.split(' ')[0];
  let can = document.getElementById('cmbCampaign').value.split(' ')[1];
  let canal = can.substring(1, can.length - 1);

  let resp = await UC_get_async(`SELECT distinct value2 from ccdata.dispositions where 
    value1 = '${document.getElementById('cmbRes1').value}' and campaign = '${campana}' AND channel = '${canal}'`, '');
  $('#cmbRes2').empty();
  $('#cmbRes3').empty();
  let respuesta = JSON.parse(resp);
  if (respuesta[0].value2.length > 0) {
    hayMasTipificaciones = true;
    $("#cmbRes2").trigger("chosen:updated");
    $('#cmbRes2').prepend("<option disabled selected value>Select a disposition</option>");
    respuesta.map((item) => $('#cmbRes2').append(new Option(item.value2, item.value2)));
    $("#cmbRes2").trigger("chosen:updated");
  } else {
    hayMasTipificaciones = false;
    consultarAccion();
  }
  $("#cmbRes2").trigger("chosen:updated");
  $("#cmbRes3").trigger("chosen:updated");
});

$('#cmbRes2').change(async () => {
  let campana = document.getElementById('cmbCampaign').value.split(' ')[0];
  let can = document.getElementById('cmbCampaign').value.split(' ')[1];
  let canal = can.substring(1, can.length - 1);

  let resp = await UC_get_async(`SELECT distinct value3 from ccdata.dispositions where 
        value1 = '${document.getElementById('cmbRes1').value}' and 
        value2 = '${document.getElementById('cmbRes2').value}' and 
        campaign = '${campana}' and channel = '${canal}'`, '');

  $('#cmbRes3').empty();
  let respuesta = JSON.parse(resp);
  if (respuesta[0].value3.length > 0) {
    hayMasTipificaciones = true;
    $("#cmbRes3").trigger("chosen:updated");
    $('#cmbRes3').prepend("<option disabled selected value>Select a disposition</option>");
    respuesta.map((item) => $('#cmbRes3').append(new Option(item.value3, item.value3)));
    $("#cmbRes3").trigger("chosen:updated");
  } else {
    hayMasTipificaciones = false;
    consultarAccion();
  }

});

$('#cmbRes3').change(() => {
  consultarAccion();
  hayMasTipificaciones = false;
});


async function consultarAccion() {

  document.getElementById('datediv').style.display = 'none';

  let campana = document.getElementById('cmbCampaign').value.split(' ')[0];
  let can = document.getElementById('cmbCampaign').value.split(' ')[1];
  let canal = can.substring(1, can.length - 1);

  let res1 = document.getElementById('cmbRes1').value;
  let res2 = document.getElementById('cmbRes2').value;
  let res3 = document.getElementById('cmbRes3').value;
  let respi = await UC_get_async(`SELECT action from ccdata.dispositions where value1 = '${res1}' and value2 = '${res2}' and value3 = '${res3}' and campaign = '${campana}' and channel = '${canal}'`, '');
  let accion = JSON.parse(respi);

  if (res1.toUpperCase() === "RESCHEDULE" || res1.toUpperCase() === "REAGENDA" || res1.toUpperCase() === "RESPOOL") globalaction = "RESCHEDULE";
  if (res1.toUpperCase() === "BLACKLIST" || res1.toUpperCase() === "LISTA NEGRA" || res1.toUpperCase() === "DO NOT CALL" || res1.toUpperCase() === "NO LLAMAR MAS") globalaction = "BLACKLIST";
  if (accion.length && accion[0].action != "NOACTION") globalaction = accion[0].action.toUpperCase();

  if (globalaction == "RESCHEDULE") document.getElementById('datediv').style.display = 'block';

}

///

//Carga de datos del cliente si existe:
async function loadCustomer(callid, justAsking = false) { //phone or email

  let resp = JSON.parse(await UC_get_async(`SELECT * FROM ccrepo.CRMLite_customers WHERE id_customer = ${callid} LIMIT 1`, ''));

  if (!resp.length) {
    resp = JSON.parse(await UC_get_async(`SELECT * FROM ccrepo.CRMLite_customers WHERE phone = "${callid}" LIMIT 1`, ''));
  }

  if (!resp.length) {
    resp = JSON.parse(await UC_get_async(`SELECT * FROM ccrepo.CRMLite_customers WHERE email = "${callid}" LIMIT 1`, ''));
  }

  if (!resp.length) {
    resp = JSON.parse(await UC_get_async(`SELECT * FROM ccrepo.CRMLite_customers WHERE document = "${callid}" LIMIT 1`, ''));
  }


  if (justAsking) {
    //retornamos el valor sin adjuntar los datos si solo esta preguntando.
    //Por defecto, los datos son cargados si no se lo aclara la variable justAsking.
    return resp.length ? resp[0] : [];
  }

  if (resp.length > 0) {
    fileArray = []; //vacio el array  para dejarle paso a los archivos del nuevo customer
    document.getElementById('txtDocument').value = resp[0].document;
    document.getElementById('txtName').value = resp[0].name;
    document.getElementById('txtPhone').value = resp[0].phone;
    document.getElementById('txtEmail').value = resp[0].email;
    document.getElementById('txtAddress').value = resp[0].address;
    document.getElementById('txtColony').value = resp[0].colony;
    document.getElementById('txtCp').value = resp[0].cp;
    document.getElementById('txtCity').value = resp[0].city;
    document.getElementById('txtState').value = resp[0].state;
    document.getElementById('txtCountry').value = resp[0].country;
    document.getElementById('txtField1').value = resp[0].field1;
    document.getElementById('txtField2').value = resp[0].field2;
    document.getElementById('txtField3').value = resp[0].field3;
    resp[0].field4 ? document.getElementById('cmbField4').value = resp[0].field4 : null
    resp[0].field5 ? document.getElementById('cmbField5').value = resp[0].field5 : null
    resp[0].files ? await loadFiles(resp[0].files) : null;
    customerFound = Number(resp[0].id_customer);
    notification('Congrats!', 'The customer was loaded successfully', 'fa fa-success', 'success');
    manualFormValidation();
    await loadHistoryTable(customerFound, config.historyLimit);

    return;
  } else {
    customerFound = '';
    return;
  }

}
//Se busca historial de gestiones para cargarlo sobre la tabla inferior:
async function loadHistoryTable(cid, limit = 5) {


  let tablita = JSON.parse(await UC_get_async(`SELECT * FROM ccrepo.CRMLite_management WHERE id_customer = ${cid} ORDER BY date DESC LIMIT ${limit}`, ''));
  if (tablita.length) {

    document.getElementById("cntHistory").style.display = 'block';
    let documento = '';
    tablita.map((item) => {
      documento += `
        <tr>
            <td>${item.date}</td>
            <td>${item.agent}</td>
            <td>${item.queuename}</td>
            <td>${item.lvl1}</td>
            <td>${item.lvl2}</td>
            <td>${item.lvl3}</td>
            <td>${item.note}</td>
            <td>${item.channel}</td>    
            <td>${item.callid}</td>    
        </tr>
        `
    })
    document.getElementById('tblBodyHistory').innerHTML = documento;

  } else {

    document.getElementById("cntHistory").style.display = 'none';
    document.getElementById("tblBodyHistory").innerHTML = `
        <tr>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>    
            <td>-</td>    
        </tr>
        `;
  }
}

//Se añaden archivos cargados de la bbdd y los que vamos añadiendo en el correr de la interaccion
async function loadFiles(files) {

  let fileStr = "";
  let filesParse = files.split('|');

  filesParse.map((item) => {
    fileArray.push(item);//actualizo mi array con elementos nuevos
  });

  fileArray.map((item, pos) => {

    let reparse = item.split('>')
    fileStr += `<div class="badge-file badge-file-primary">
								<spam>
                  <i data-posicion="${pos}" class="closebadge fa fa-window-close"></i>
                  <a href="${reparse[1]}" target="_blank">${reparse[0]}</a>
								</spam>
							</div>`;
  });

  document.getElementById('filediv').innerHTML = fileStr;
  await updateBadges(); //actualizo los elementos 
}


//eliminar un archivo de tipo link y actualizacion de elementos pills
async function updateBadges() {

  let closebadge = document.querySelectorAll('.closebadge');

  for (let i = 0; i < closebadge.length; i++) {

    closebadge[i].addEventListener('click', (e) => {
      console.log(e);
      console.log(e.path[0].dataset.posicion); //de aqui sacaremos la posicion del mismo para eliminarlo del array

      swal({
        title: "Are you sure?",
        buttons: {
          cancel: true,
          confirm: "Confirm"
        },
        closeOnClickOutside: false,
      }).then((res) => {
        let fileStr = "";
        if (res) {
          fileArray.splice(Number(e.path[0].dataset.posicion), 1)
          let i = 0;
          fileArray.map((item) => {
            let reparse = item.split('>')
            fileStr += `<div class="badge-file badge-file-primary">
								<spam>
                  <i id="closebadge" data-posicion="${i}" class="closebadge fa fa-window-close"></i>
                  <a href="${reparse[1]}" target="_blank">${reparse[0]}</a>
								</spam>
							</div>`;
            i++;
          });

          document.getElementById('filediv').innerHTML = fileStr;
          updateBadges()
        }
      });
    });
  }
}

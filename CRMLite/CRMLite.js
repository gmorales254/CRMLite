//# sourceURL=CRMLite.js
import * as fvalidation from './FieldsValidation.js';
import getConfig from './CRMLiteConfig.js';

preBindTab(null); //Don't delete this line

//Documentation for devs:
//https://www.notion.so/CRMLite-dev-s-manual-6457517922e841dea181425934739e99
//How to use manual:
//https://www.notion.so/How-to-use-CRMLite-0b3741ef947e46d2a7e6b575647161a7

var language = parent.language;
var options = {
  lng: language,
  resGetPath: "translation_" + language + ".json",
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
var customerFound = "";
var callid = "";
var structure;
var config; //all the settings from the database


// SEARCH
document.getElementById("btnSearch").addEventListener("click", async () => {
  if (!document.getElementById("txtSearch").value) {
    notification("Warning", "The input is empty", "fa fa-warning", "warning");
    return null;
  }

  let resp = await loadCustomer(
    "phone",
    document.getElementById("txtSearch").value,
    true
  );
  if (resp.length) {
    resp = resp[0];

    swal("Great news", `The customer ${resp.name} can be loaded`, {
      buttons: {
        cancel: true,
        confirm: "Load it for me!",
      },
      closeOnClickOutside: false,
    }).then((res) => {
      if (res) {
        loadCustomer("id", resp.id, false);
      }
    });
  } else {
    swal("We don't found the customer", "try again with another params", {
      buttons: {
        cancel: true,
        confirm: "Thanks",
      },
    });
  }
});

// SAVE
document.getElementById("btnSave").addEventListener("click", async () => {
  fvalidation.manualFormValidation(structure);

  if (!hayMasTipificaciones) {
    if (
      !config.saveWithoutDispo.active ||
      (config.saveWithoutDispo.active && callid) ||
      !customerFound
    ) {
      let resp = await saveContactInfo();
      if (resp === false) {
        return false;
      }
    }

    if (globalaction === "BLACKLIST") {
      await addToBlacklist();
    } else if (globalaction === "RESCHEDULE") {
      if (!document.getElementById("dateframe").value) {
        notification(
          "Sorry",
          "please, choose a date for schedule",
          "fa fa-warning",
          "warning"
        );
        return;
      }
      await makeReschedule();
    }else if(globalaction === "BLACKLISTTEMP"){
      if (!document.getElementById("dateframe").value) {
        notification(
          "Sorry",
          "please, choose a date for schedule the blacklist number",
          "fa fa-warning",
          "warning"
        );
        return;
      }else{

        let blacklistdate = moment(document.getElementById('dateframe').value).format("YYYY-MM-DD 00:00:00")
        await addToBlacklistSchedule(blacklistdate);
     
      }
    }

    let campana = document.getElementById("cmbCampaign").value.split(" ")[0];
    let can = document.getElementById("cmbCampaign").value.split(" ")[1];
    let canal = can.substring(1, can.length - 1);

    if (GUID) {
      let tag = "";
      if (document.getElementById("cmbRes1").value)
        tag = document.getElementById("cmbRes1").value;
      if (document.getElementById("cmbRes2").value)
        tag += "|" + document.getElementById("cmbRes2").value;
      if (document.getElementById("cmbRes3").value)
        tag += "|" + document.getElementById("cmbRes3").value;
      let objSave = new Object();
      objSave.channel = canal;
      objSave.dateprocessed = moment().format("YYYY-MM-DD HH:mm:ss");
      objSave.agent = parent.userid;
      objSave.value1 = document.getElementById("cmbRes1").value;
      objSave.value2 = document.getElementById("cmbRes2").value;
      objSave.value3 = document.getElementById("cmbRes3").value;
      objSave.guid = GUID;
      objSave.campaign = campana;
      objSave.comment = document.getElementById("txtNote").value;
      objSave.data1 = "callid: " + callid;
      objSave.data2 = "";
      objSave.callerid = document.querySelector('[data-fieldid="phone"]').value;
      let guardado = await UC_Save_async(
        objSave,
        "ccrepo.dispositions_repo",
        ""
      );

      UC_TagRecord(GUID, tag);

      if (guardado !== "OK") {
        notification(
          "Bad request",
          "Ups! It's me, not you. Try again",
          "fa fa-times",
          "danger"
        );
        return;
      }


      let value1 = document.getElementById("cmbRes1").value;
      let value2 = document.getElementById("cmbRes2").value;
      let value3 = document.getElementById("cmbRes3").value;

      let gamification = await UC_get_async(`SELECT gamification_measure FROM dispositions WHERE value1="${value1}" AND value2="${value2}" AND value3="${value3}"`, 'Data');
      if (gamification.length) { //hay action de gamification para ejecutar
        gamification = JSON.parse(gamification)[0]['gamification_measure'];
        let response = await UC_GM_LoadActions(gamification, 1);
        console.log(response);
      }


    }

    // manejo de las dispositions sobre CRMLite_management >
    let phn = document.querySelector('[data-fieldid="phone"]').value
    let cliente = await fvalidation.getFieldsInformationByParam("phone", phn);


    let objMang = {
      id_customer: cliente[0].id,
      date: moment().format("YYYY-MM-DD HH:mm:ss"),
      agent: parent.agent.accountcode,
      lvl1: document.getElementById("cmbRes1").value,
      lvl2: document.getElementById("cmbRes2").value,
      lvl3: document.getElementById("cmbRes3").value,
      note: document.getElementById("txtNote").value,
      queuename: campana,
      channel: canal,
      guid: GUID,
      callid: callid,
    };

    let ress = await UC_Save_async(objMang, "CRMLite_management", "");

    if (ress === "OK") {
      notification("Congratulation!", "", "fa fa-success", "success");
      let ringbachk = document.getElementById('ringbaTransfer').checked;
      if (config.RingbaTransfer.active && ringbachk) await ringbaTransfer(); //si checked y tenemos activa la feature, entonces enviamos datos a Ringba.
      UC_closeForm();
    }
  } else {
    notification(
      "Disposition",
      "The disposition is not completed",
      "fa fa-times",
      "danger"
    );
  }
});

document
  .getElementById("btnContactSave")
  .addEventListener("click", async () => {

    let formValid = fvalidation.manualFormValidation(structure);
    if (formValid) {

      let resp = await saveContactInfo();
      if (resp) {
        UC_closeForm();
      }
    }
  });

  document.getElementById('btnUpdateBlackListDate').addEventListener('click', async (e)=>{
    console.info('btnUpdateBlackListDate event click');
    e.target.disabled = true;
    let callerid = document.querySelector(`[data-fieldid="phone"]`).value;
    let schedule = document.getElementById('lms-nextpayment').value;
    let due = document.getElementById('lms-due').value;

    if (!callerid){
      notification("We don't found a phone number active", `Fill the field "phone" to continue`, "fa fa-error", "warning");
      e.target.disabled = false;
      return;
    }
    if(!due){
      notification("Fill the field 'Due' to continue","", "fa fa-warning", "warning");
      e.target.disabled = false;
      return;
    }
    if(!schedule){
      notification("You didn't set a date for the next payment", ``, "fa fa-error", "warning");
      e.target.disabled = false;
      return;
    }else{
      schedule = moment(schedule).format("YYYY-MM-DD 00:00:00");
    }
    let resp, resp2; 
    try{
      resp = await addToBlacklistSchedule(schedule);
      resp2 = await UC_exec_async(`UPDATE ccrepo.CRMLite_customersV2 SET promise = "${due}", schedule_promise = "${schedule}" WHERE phone = "${callerid}"`, '');
    }catch(err){
      resp = "ERROR";
      resp2 = "ERROR";
      e.target.disabled = false;
    }


    if(resp.toUpperCase() == "OK" && resp2.toUpperCase() == "OK"){
      notification(`The phone number ${callerid} has been blacklisted successfully for ${schedule}`, ``, "fa fa-success", "success");
    }else{
      notification(`Something has been lost`, `please, try later.`, "fa fa-warning", "warning");
    }

    e.target.disabled = false;

  });

  document.getElementById('btnCleanBlackListDate').addEventListener('click', async (e)=>{
    console.info('btnCleanBlackListDate event click')
    let callerid = document.querySelector(`[data-fieldid="phone"]`).value;
    e.target.disabled = true;
    if (!callerid){
      notification("We don't found a phone number active", `Fill the field "phone" to continue`, "fa fa-error", "warning");
      e.target.disabled = false;
      return;
    }

    let resp;
    try{
      resp = await UC_exec_async(`CALL ccdata.blacklist_schedule_procedure_deletefrom("${callerid}")`, '');
    }catch(e){
      resp = "ERROR"
    }
    if(resp.toUpperCase() == "OK"){
      notification(`The number ${callerid} has been deleted from our blacklist`, ``, "fa fa-success", "success");
      document.getElementById('lms-due').value = "";
      document.getElementById('lms-nextpayment').value = "";
    }else{
      notification("Something went wrong with the data or database", `please, try later.`, "fa fa-error", "warning");
    }

    e.target.disabled = false;
  })


async function ringbaTransfer() {
  let callerid = document.querySelector(`[data-fieldid="phone"]`).value;
  let url = `https://display.ringba.com/enrich/${config.RingbaTransfer.val}?callerid=${callerid}&`; //url + id + ?
  let paramsArr = [];


  structure.map(element => {
    const {fieldId, fieldType, active, ringbatag} = element;
    let fieldDOM = document.querySelector(`[data-fieldid="${fieldId}"]`);
    let val = "";
    if (active == true && !!ringbatag) {

      val = fieldType === "checkbox" ? fieldDOM.checked : fieldDOM.value;
     
        if (val !== "") {
          paramsArr.push(`${ringbatag}=${val}`);
        }
      

    }
  });

  url += paramsArr.join('&');

  let resp = await UC_Http_proxy({
    url: url,
    method: 'POST',
    headers: {},
    body: '{}',
    type: 'application/json',
    timeout: 1000
  });

  if(resp.code === 200) notification("The info has been transfered to Ringba", `id: ${config.RingbaTransfer.val}`, "fa fa-success", "success");
  else notification("Error transfering the data to Ringba", `env id: ${config.RingbaTransfer.val}`, "fa fa-error", "warning");

}

//Save contacto info ()
async function saveContactInfo() {
  if (fvalidation.manualFormValidation(structure)) {
    //parseo mi array de archivos a una cadena de string sola para guardar en la base:
    let fileArrayParse = "";
    if (fileArray.length) {
      fileArray.map((item, pos, comp) => {
        fileArrayParse += item;
        if (pos < comp.length - 1) fileArrayParse += "|";
      });
    }

    let customerData = fvalidation.parseInformationToObj(structure);
    customerData.files = fileArrayParse;

    if (customerFound) {
      //debo actualizar

      customerData.id = customerFound; //asigno id;
      let resp = UC_update_async(
        customerData,
        "CRMLite_customersV2",
        "id",
        ""
      );
      console.log("updated response: " + resp);
    } else {
      //genero este usuario como nuevo
      let resp = UC_Save_async(customerData, "CRMLite_customersV2", "");
      console.log("saved response: " + resp);
    }

    notification(
      "Congrats!",
      "The contact information was save",
      "fa fa-success",
      "success"
    );
    return true;
  } else {
    notification(
      "Warning",
      "The form is not complete or valid at all",
      "fa fa-warning",
      "warning"
    );
    return false;
  }
}

//makeReschedule
async function makeReschedule() {
  if (document.getElementById("dateframe").value) {
    let callerid = document.querySelector(`[data-fieldid="phone"]`).value;
    let querypart = `WHERE destination like '%${
      document.querySelector(`[data-fieldid="phone"]`).value
      }%' OR (alternatives <> '' 
      AND (alternatives like '%${document.querySelector(`[data-fieldid="phone"]`).value}%' 
      OR alternatives like '%${document.querySelector(`[data-fieldid="phone"]`).value}%'))`;

    let queryC = `DELETE FROM ccdata.calls_spool ${querypart}`;
    let queryS = `DELETE FROM ccdata.calls_scheduler ${querypart}`;
    await UC_exec_async(queryC, "");
    await UC_exec_async(queryS, "");

    let resp = await UC_exec_async(
      `INSERT INTO ccdata.calls_scheduler (id, calldate, campaign, destination, agentphone) VALUES(null, 
                '${moment(document.getElementById("dateframe").value).format(
        "YYYY-MM-DD hh:mm:ss"
      )}', 
                '${config.defaultPreview.val}', '${callerid}', ${
      parent.agent.name
      })`,
      ""
    );
  }
}

// BLACKLIST Add
async function addToBlacklist() {
  let objeto = new Object();
  objeto.phone = document.querySelector(`[data-fieldid="phone"]`).value;
  objeto.campaign = "*";
  objeto.username = parent.userid;
  objeto.lastchaged = moment().format("YYYY-MM-DD HH:mm:ss");

  await UC_exec_async(`CALL ccdata.blacklist_schedule_procedure(${objeto.phone}, '*', ${objeto.username}, '')`, '');
  UC_audit(`BLACKLIST CRMLITE: The user ${parent.userid} insert ${document.querySelector(`[data-fieldid="phone"]`).value} to BlackList`);
}

async function addToBlacklistSchedule(schedule) {
  schedule = !schedule ? moment().add('days', 1).format("YYYY-MM-DD 00:00:00") : schedule; //control preventivo de si viene o no la variable Schedule llena.
  let phone = document.querySelector(`[data-fieldid="phone"]`).value;
  let resp = await UC_exec_async(`CALL ccdata.blacklist_schedule_procedure("${phone}", '*', "${parent.userid}", "${schedule}")`, '');
  if(resp.toUpperCase() === "OK") UC_audit(`TEMPORAL BLACKLIST CRMLITE: The user ${parent.userid} insert ${phone} to temporal BlackList schedule for ${schedule}`);
  return resp;
}

//Limpiar todos los fields del react form o eliminar el usuario en caso de encontrarlo>
document.getElementById("btnClean").addEventListener("click", async () => {
  if (!customerFound) {
    reactform.reset();
  } else {
    swal("Warning", "Do you want to delete this record?", "warning", {
      buttons: {
        cancel: true,
        confirm: "Confirm",
      },
    }).then(async (res) => {
      if (res) {
        let resp = await UC_exec_async(
          `DELETE FROM CRMLite_customersV2 WHERE id = ${customerFound}`,
          ""
        );
        let respi = await UC_exec_async(
          `DELETE FROM CRMLite_management WHERE id_customer = ${customerFound}`,
          ""
        );
        if (resp == "OK") {
          swal(
            "Congrats",
            "The customers has been delete successfully",
            "success"
          );
          reactform.reset();
          UC_closeForm();
        } else {
          swal(
            "Ups!",
            "We have some issues exprience, please try later",
            "warning"
          );
        }
      }
    });
  }
});

//Realizar llamadas con el boton del icono phone >


//Agregar un archivo de tipo link
document.getElementById("bdgNewfile").addEventListener("click", () => {
  swal({
    title: "Add a new link to your file step: 1/2",
    content: {
      element: "input",
      attributes: {
        placeholder: "Type the file name with extension ('Document.pdf')",
        type: "text",
        id: "inpDocName",
        required: true,
      },
    },
    buttons: {
      cancel: true,
      confirm: "Confirm",
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
            id: "inpUrlDoc",
          },
        },
        buttons: {
          cancel: true,
          confirm: "Confirm",
        },
        closeOnClickOutside: false,
      }).then((urlpath) => {
        let expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        let regexUrl = new RegExp(expression);

        if (urlpath && regexUrl.test(urlpath.replace(/ /g, ""))) {
          loadFiles(
            `${urlname.replace(/ /g, "")}>${urlpath.replace(/ /g, "")}`
          ); //le quito los espacios y lo mando
        } else {
          swal({
            title: "The URL is invalid, please, check again",
          });
          return;
        }
      });
    } else {
      swal({
        title: "You dont type the file name",
      });
      return;
    }
  });
});

// Funcion inicial >>
//Oculto elementos que no se utilizaran hasta el momento de cargar todo>
async function init() {

  config = await getConfig();
  if (config.RingbaTransfer.active) document.querySelector('.ringbaTransfer_container').style.display = "";
  if (config.lmsFields.active) document.getElementById("lmsdiv").style.display = "flex"; //mostrar el div de LMS
  if(CTI){

    let CTIParsee = JSON.parse(CTI);
    structure = await fvalidation.getStructure('CRMLite_structure', 'Repo', CTIParsee.Channel, CTIParsee.Campaign);

  }else{

    structure = await fvalidation.getStructure('CRMLite_structure', 'Repo');
   
  }
  let resp = await fvalidation.insertFieldsConvertedToHTML(structure, 3);
  if (resp === true) notification('Success to load fields', '', 'fa fa-success', 'success');
  document.querySelectorAll('.containerform').forEach(element => { element.style.display = "" })

  let countPhoneFileds = document.querySelectorAll(`.phoneAddon`);

  countPhoneFileds.forEach(element => {
    let id = element.dataset.phoneid;
    let inpt = document.querySelector(`[data-fieldid="${id}"]`);

    element.addEventListener("click", async () => {
      if (!inpt.value) {
        notification(
          "Sorry",
          "the phone number is empty",
          "fa fa-warning",
          "warning"
        );
      } else {

        await UC_makeCall_async(
          config.outQueue.val,
          "",
          Number(inpt.value)
        );
      }
    });

  });

  reactform.reset();
  document.getElementById("dateframe").min = moment().format(
    "YYYY-MM-DDThh:mm"
  );
  //config para cerrar el form despues de X tiempo
  if (config.closeForm.active) {
    setTimeout(() => {
      UC_closeForm();
    }, config.closeForm.val);
  }

  document.getElementById("datediv").style.display = "none";
  document.getElementById("cntHistory").style.display = "none";
  document.getElementById("tblSearch").style.display = "none";
  document.getElementById("btnContactSave").style.display = "none";

  if (config.saveWithoutDispo.active && !CTI) {
    document.getElementById("btnContactSave").style.display = "block";
  }

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
        document.querySelector(`[data-fieldid="email"]`).value = CTIParse.Callerid;
        GUID = CTIParse.Guid;
        document.getElementById(
          "cmbCampaign"
        ).value = `${CTIParse.Campaign} (email)`;
        document.getElementById("cmbCampaign").disabled = true;
        completarD1();
        callid = CTIParse.Callerid;
      } else {
        document.querySelector(`[data-fieldid="email"]`).value = CTIParse.Callerid;
        GUID = CTIParse.Guid;
        document.getElementById(
          "cmbCampaign"
        ).value = `${CTIParse.Campaign} (webchat)`;
        document.getElementById("cmbCampaign").disabled = true;
        completarD1();
        callid = CTIParse.Callerid;
      }
      await loadCustomer("email", CTIParse.Callerid);
    } else if (CTIParse.Channel === "sms") {
      document.querySelector(`[data-fieldid="phone"]`).value = CTIParse.Callerid;
      GUID = CTIParse.Guid;
      document.getElementById(
        "cmbCampaign"
      ).value = `${CTIParse.Campaign} (sms)`;
      document.getElementById("cmbCampaign").disabled = true;
      completarD1();
      callid = CTIParse.Callerid;

      await loadCustomer("phone", CTIParse.Callerid);
    } else {
      GUID = CTIParse.Guid;
      document.getElementById(
        "cmbCampaign"
      ).value = `${CTIParse.Campaign} (messenger)`;
      document.getElementById("cmbCampaign").disabled = true;
      completarD1();
      callid = CTIParse.Callerid;
      notification(
        "Hey!",
        "We can't load the contact information from messenger, search it by phone or email.",
        "fa fa-warning",
        "warning"
      );
    }
  } else if (CTI) {
    //Canal de llamada
    let CTIParse = JSON.parse(CTI);
    document.querySelector(`[data-fieldid="phone"]`).value = CTIParse.Callerid;
    GUID = CTIParse.Guid;
    console.log(`${CTIParse.Campaign} (telephony)`);

    if (config.blindTransfer.active){
      document.querySelector('.transferInput_container').style.display = ""; // si tenemos el blindTransfer activo, lo habilitamos.
      
//TRANSFER:

document.getElementById('attendTransferAddon').addEventListener('click', async () => {
  let numeroLlamada = document.querySelector(`[data-fieldid="phone"]`).value;
  let agentto = document.getElementById('txtExten').value;
  if (!!agentto && !!numeroLlamada) {
    let resp = await UC_exec_async(`INSERT INTO ccrepo.CRM_temp (agentFrom, agentto, callerId) 
		VALUES ('${parent.agent.name}', '${agentto}', '${numeroLlamada}')`, '');

    if (resp == "OK") {
      parent.__SendDTMF(`#0${agentto}`);
    }

  }

})
    }
    document.getElementById(
      "cmbCampaign"
    ).value = `${CTIParse.Campaign} (telephony)`;
    document.getElementById("cmbCampaign").disabled = true;
    completarD1();
    await loadCustomer("phone", CTIParse.Callerid);

    callid = CTIParse.Callerid;

    if (CTIParse.ParAndValues) {
      let ParAndValuesArray = CTIParse.ParAndValues.split(":");
      ParAndValuesArray.map((item) => {

        let parval = item.split("=");
        let field = structure.filter(e => e.fieldId === parval[0]);

        if (field.length) document.querySelector(`[data-fieldid="${parval[0]}"]`).value = parval[1];

      });
    }
  } else {
    //Sin interaccion
    console.log("Sin interaccion activa");
    document.getElementById("cmbCampaign").disabled = false;
    callid = "";
  }
}

//Carga de todas las campañas:
async function loadCampaigns() {
  let campaigns = [];
  //telefonia
  let channelCall = JSON.parse(await UC_getMyAgentCampaigns_async());
  if (channelCall.length)
    channelCall.map((item) => campaigns.push(`${item} (telephony)`));
  //email
  let channelEmail = JSON.parse(
    await UC_get_async(
      `SELECT name FROM ccdata.email_members WHERE agent = '${parent.agent.accountcode}'`
    )
  );
  if (channelEmail.length)
    channelEmail.map((item) => campaigns.push(`${item.name} (email)`));
  //messenger
  let channelMessenger = JSON.parse(
    await UC_get_async(
      `SELECT name FROM ccdata.messenger_members WHERE agent = '${parent.agent.accountcode}'`
    )
  );
  if (channelMessenger.length)
    channelMessenger.map((item) => campaigns.push(`${item.name} (messenger)`));
  //sms
  let channelSms = JSON.parse(
    await UC_get_async(
      `SELECT name FROM ccdata.sms_members WHERE agent = '${parent.agent.accountcode}'`
    )
  );
  if (channelSms.length)
    channelSms.map((item) => campaigns.push(`${item.name} (sms)`));
  //Webchat
  let channelWeb = JSON.parse(
    await UC_get_async(
      `SELECT name FROM ccdata.webchat_members WHERE agent = '${parent.agent.accountcode}'`
    )
  );
  if (channelWeb.length)
    channelWeb.map((item) => campaigns.push(`${item.name} (webchat)`));

  //cargo los datos recogidos:
  $("#cmbCampaign").empty();
  $("#cmbCampaign").trigger("chosen:updated");
  $("#cmbCampaign").prepend(
    "<option disabled selected value>Select a campaign..</option>"
  );
  campaigns.map((item) => $("#cmbCampaign").append(new Option(item, item)));
  $("#cmbCampaign").trigger("chosen:updated");
}

//Carga tipificaciones:

document.getElementById("cmbCampaign").addEventListener("change", () => {
  completarD1();
});


document.getElementById("btnShowScript").addEventListener('click', async () => {
  await loadScript();
});

async function loadScript() {
  let campana = document.getElementById("cmbCampaign").value.split(" ")[0];
  let can = document.getElementById("cmbCampaign").value.split(" ")[1];
  let canal = can.substring(1, can.length - 1);

  let resp = JSON.parse(await UC_get_async(`SELECT * FROM ccrepo.CRMLite_scripts WHERE campaign = "${campana}" AND channel = "${canal}"`))
  if (resp.length) {

    let speach = resp[0].script;

    structure.map((element) => {
      let val = document.querySelector(`[data-fieldid="${element.fieldId}"]`).value;
      speach = speach.replaceAll(`[${element.fieldId}]`, val);
    });

    speach = speach.replaceAll('[agent_name]', parent.agent.accountcode)

    swal("Script", `${speach}`, {
      buttons: {
        confirm: "Got it",
      },
    })

  }
}

async function completarD1() {
  let campana = document.getElementById("cmbCampaign").value.split(" ")[0];
  let can = document.getElementById("cmbCampaign").value.split(" ")[1];
  let canal = can.substring(1, can.length - 1);

  let resp = JSON.parse(await UC_get_async(`SELECT distinct value1 FROM dispositions WHERE campaign = '${campana}' AND channel = '${canal}'`, "Data"));

  if (resp.length) {

    $("#cmbRes1").empty();
    $("#cmbRes1").trigger("chosen:updated");
    $("#cmbRes1").prepend(
      "<option disabled selected value>Select a disposition</option>"
    );
    resp.map((item) => $("#cmbRes1").append(new Option(item.value1, item.value1)));
    $("#cmbRes1").trigger("chosen:updated");


  }

}

$("#cmbRes1").change(async () => {
  let campana = document.getElementById("cmbCampaign").value.split(" ")[0];
  let can = document.getElementById("cmbCampaign").value.split(" ")[1];
  let canal = can.substring(1, can.length - 1);

  let resp = await UC_get_async(
    `SELECT distinct value2 from ccdata.dispositions where 
    value1 = '${
    document.getElementById("cmbRes1").value
    }' and campaign = '${campana}' AND channel = '${canal}'`,
    ""
  );
  $("#cmbRes2").empty();
  $("#cmbRes3").empty();
  let respuesta = JSON.parse(resp);
  if (respuesta[0].value2.length > 0) {
    hayMasTipificaciones = true;
    $("#cmbRes2").trigger("chosen:updated");
    $("#cmbRes2").prepend(
      "<option disabled selected value>Select a disposition</option>"
    );
    respuesta.map((item) =>
      $("#cmbRes2").append(new Option(item.value2, item.value2))
    );
    $("#cmbRes2").trigger("chosen:updated");
  } else {
    hayMasTipificaciones = false;
    consultarAccion();
  }
  $("#cmbRes2").trigger("chosen:updated");
  $("#cmbRes3").trigger("chosen:updated");
});

$("#cmbRes2").change(async () => {
  let campana = document.getElementById("cmbCampaign").value.split(" ")[0];
  let can = document.getElementById("cmbCampaign").value.split(" ")[1];
  let canal = can.substring(1, can.length - 1);

  let resp = await UC_get_async(
    `SELECT distinct value3 from ccdata.dispositions where 
        value1 = '${document.getElementById("cmbRes1").value}' and 
        value2 = '${document.getElementById("cmbRes2").value}' and 
        campaign = '${campana}' and channel = '${canal}'`,
    ""
  );

  $("#cmbRes3").empty();
  let respuesta = JSON.parse(resp);
  if (respuesta[0].value3.length > 0) {
    hayMasTipificaciones = true;
    $("#cmbRes3").trigger("chosen:updated");
    $("#cmbRes3").prepend(
      "<option disabled selected value>Select a disposition</option>"
    );
    respuesta.map((item) =>
      $("#cmbRes3").append(new Option(item.value3, item.value3))
    );
    $("#cmbRes3").trigger("chosen:updated");
  } else {
    hayMasTipificaciones = false;
    consultarAccion();
  }
});

$("#cmbRes3").change(() => {
  consultarAccion();
  hayMasTipificaciones = false;
});

async function consultarAccion() {
  let campana = document.getElementById("cmbCampaign").value.split(" ")[0];
  let can = document.getElementById("cmbCampaign").value.split(" ")[1];
  let canal = can.substring(1, can.length - 1);

  let res1 = document.getElementById("cmbRes1").value;
  let res2 = document.getElementById("cmbRes2").value;
  let res3 = document.getElementById("cmbRes3").value;

  let respi = await UC_get_async(
    `SELECT action from ccdata.dispositions where value1 = '${res1}' and value2 = '${res2}' and value3 = '${res3}' and campaign = '${campana}' and channel = '${canal}'`,
    ""
  );
  let accion = JSON.parse(respi);
  let arrRespool = ['RESPOOL'];
  let arrReschedule = ['REAGENDA', 'RESCHEDULE'];
  let arrBlacklist = ['BLACKLIST', 'LISTA NEGRA', 'DO NOT CALL', 'NO LLAMAR MAS', 'DNC'];
  let arrBlacklistTemp = ['BLACKLIST TEMP', 'DNC TEMP', 'LISTA NEGRA TEMPORAL'];

  if (accion.length && accion[0].action != "NOACTION") globalaction = accion[0].action.toUpperCase();
  if (arrReschedule.includes(res1.toUpperCase())) globalaction = "RESCHEDULE";
  if (arrRespool.includes(res1.toUpperCase())) globalaction = "RESPOOL";
  if (arrBlacklist.includes(res1.toUpperCase())) globalaction = "BLACKLIST";
  if (arrBlacklistTemp.includes(res1.toUpperCase())) globalaction = "BLACKLISTTEMP";

  if (globalaction == "RESCHEDULE") document.getElementById("datediv").style.display = "block";
  else document.getElementById("datediv").style.display = "none";
  
}

///

//Carga de datos del cliente si existe:
async function loadCustomer(searchBy, callid, justAsking = false) {
  //phone or email

  let arrCustomer = await fvalidation.getFieldsInformationByParam(searchBy, callid);

  if (justAsking) {
    //retornamos el valor sin adjuntar los datos si solo esta preguntando.
    //Por defecto, los datos son cargados si no se lo aclara la variable justAsking.
    return arrCustomer;
  }

  let objInfo = {}
  if (arrCustomer.length > 0) {
    objInfo = JSON.parse(arrCustomer[0]['information']);
    fileArray = [];

    //vacio el array  para dejarle paso a los archivos del nuevo customer
    let respInsert = fvalidation.insertFieldsInformation(objInfo, structure, arrCustomer[0].phone, arrCustomer[0].email, arrCustomer[0].name);
    document.getElementById('lms-due').value = arrCustomer[0].promise ? arrCustomer[0].promise : "";
    document.getElementById('lms-nextpayment').value = arrCustomer[0].schedule_promise ?  moment(arrCustomer[0].schedule_promise).format("YYYY-MM-DDThh:mm") : "";

    customerFound = Number(arrCustomer[0].id);
    notification(
      "Congrats!",
      "The customer was loaded successfully",
      "fa fa-success",
      "success"
    );
    fvalidation.manualFormValidation(structure);
    let limitrows = 5;
    if (config.historyLimit.active && typeof Number(config.historyLimit.val) === "number") limitrows = config.historyLimit.val;
    await loadHistoryTable(customerFound, limitrows);

    return;
  } else {
    customerFound = "";
    return;
  }
}
//Se busca historial de gestiones para cargarlo sobre la tabla inferior:
async function loadHistoryTable(cid, limit = 5) {
  document.getElementById("cntHistory").style.display = "block";
  let tablita = JSON.parse(
    await UC_get_async(
      `SELECT * FROM ccrepo.CRMLite_management WHERE id_customer = ${cid} ORDER BY date DESC LIMIT ${limit}`,
      ""
    )
  );
  if (tablita.length) {
    let documento = "";
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
        `;
    });
    document.getElementById("tblBodyHistory").innerHTML = documento;
  } else {
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
  let filesParse = files.split("|");

  filesParse.map((item) => {
    fileArray.push(item); //actualizo mi array con elementos nuevos
  });

  fileArray.map((item, pos) => {
    let reparse = item.split(">");
    fileStr += `<div class="badge-file badge-file-primary">
								<spam>
                  <i data-posicion="${pos}" class="closebadge fa fa-window-close"></i>
                  <a href="${reparse[1]}" target="_blank">${reparse[0]}</a>
								</spam>
							</div>`;
  });

  document.getElementById("filediv").innerHTML = fileStr;
  await updateBadges(); //actualizo los elementos
}

//eliminar un archivo de tipo link y actualizacion de elementos pills
async function updateBadges() {
  let closebadge = document.querySelectorAll(".closebadge");

  for (let i = 0; i < closebadge.length; i++) {
    closebadge[i].addEventListener("click", (e) => {
      console.log(e);
      console.log(e.path[0].dataset.posicion); //de aqui sacaremos la posicion del mismo para eliminarlo del array

      swal({
        title: "Are you sure?",
        buttons: {
          cancel: true,
          confirm: "Confirm",
        },
        closeOnClickOutside: false,
      }).then((res) => {
        let fileStr = "";
        if (res) {
          fileArray.splice(Number(e.path[0].dataset.posicion), 1);
          let i = 0;
          fileArray.map((item) => {
            let reparse = item.split(">");
            fileStr += `<div class="badge-file badge-file-primary">
								<spam>
                  <i id="closebadge" data-posicion="${i}" class="closebadge fa fa-window-close"></i>
                  <a href="${reparse[1]}" target="_blank">${reparse[0]}</a>
								</spam>
							</div>`;
            i++;
          });

          document.getElementById("filediv").innerHTML = fileStr;
          updateBadges();
        }
      });
    });
  }
}

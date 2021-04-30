# CRMLite dev's manual

---

[how to use manual](https://www.notion.so/How-to-use-CRMLite-0b3741ef947e46d2a7e6b575647161a7)

## Figma layout

[https://www.figma.com/embed?embed_host=notion&url=https%3A%2F%2Fwww.figma.com%2Fproto%2FN8CneHv1McY42cVKhYEfmR%2FuContact-CRMLite%3Fscaling%3Dscale-down%26node-id%3D55%253A0](https://www.figma.com/embed?embed_host=notion&url=https%3A%2F%2Fwww.figma.com%2Fproto%2FN8CneHv1McY42cVKhYEfmR%2FuContact-CRMLite%3Fscaling%3Dscale-down%26node-id%3D55%253A0)

## Dialerbase example:

The available fields to load information from your parandval will be the following:

```jsx
[
  "txtName",
  "txtDocument",
  "txtAddress",
  "txtEmail",
  "txtCity",
  "txtCountry",
  "txtColony",
  "txtField1",
  "txtField2",
  "txtField3",
  "cmbField4",
  "cmbField5",
  "txtCp",
  "txtPhone",
  "txtState",
];
```

Dialerbase example:

```jsx
CRMLite_PREV->;22264614;txtName=Gaston Morales:txtEmail=gaston@gmail.com;;9999;4004
```

[testCRMLITEdialerbase.csv](examplecsv/testCRMLITEdialerbase.csv)

## Information and technicals details

### Config JSON:

This is a const variable with the simple features of CRMLite and you can personalizate by yourself.

You can find it at the first lines in the **CRMlite.js** or search it by name.

```jsx
//CONFIGURATION CONST:
const config = {
  defaultPreview: "CRMLite_Scheduler->", //for scheduled calls
  fieldsCmb: {
    cmb1: ["Production", "Test"], //free field 4
    cmb2: ["Active", "Desactivated"], //free field 5
  },
  closeForm: {
    //if you want to close automatly the form after XXXX ms
    active: false, //active here de feature
    timeInMs: 300000, // miliseconds
  },
  historyLimit: 5, //rows limit for history table at the bottom
  saveWithoutDispo: true, // you can save without disposition, if you dont have an active interaction already
  inpts: [
    "txtName",
    "txtDocument",
    "txtAddress",
    "txtEmail", //you can setup the inputs you want to allow in your parandvalues
    "txtCity",
    "txtCountry",
    "txtColony",
    "txtField1",
    "txtField2", // to be loaded
    "txtField3",
    "cmbField4",
    "cmbField5",
    "txtCp",
    "txtPhone",
    "txtState",
  ],
};
```

```jsx
//here is the expressions or regexs.
const expresiones = {
  texto: /^[a-zA-ZÀ-ÿ\s]{1,40}$/, // Letters and spaces.
  correo: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, // emails
  telefono: /^\d{7,13}$/, // 7 to 13 digits
  cp: /^\d{3,5}$/, // 3 to 5 digits.
  alphanumeric: /^[a-zA-Z0-9_\s]*$/, //alfanumeric
};
```

[CTI Channels](https://www.notion.so/2342923ccfde4f17bf16a9bf6f2ba3ba)

## H**ow to install section**

# SQL Tables and files:

### CRMLite_customers:

Customers information by agent

```sql
CREATE TABLE `CRMLite_customers` (
  `id_customer` int(100) UNSIGNED NOT NULL AUTO_INCREMENT,
  `document` varchar(60) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `phone` varchar(200) NOT NULL,
  `email` varchar(100) NOT NULL,
  `address` mediumtext DEFAULT NULL,
  `colony` varchar(200) DEFAULT NULL,
  `cp` int(6) DEFAULT 0,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(200) DEFAULT NULL,
  `field1` varchar(200) DEFAULT NULL,
  `field2` varchar(200) DEFAULT NULL,
  `field3` varchar(200) DEFAULT NULL,
  `field4` varchar(200) DEFAULT NULL,
  `field5` varchar(200) DEFAULT NULL,
  `files` longtext DEFAULT NULL,
  `active` int(1) DEFAULT 1,
  `agent` varchar(100) DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_customer`),
  KEY `Index_doc` (`document`) USING BTREE,
  KEY `Index_name` (`name`) USING BTREE,
  KEY `Index_phone` (`phone`) USING BTREE,
  KEY `Index_agent` (`agent`) USING BTREE,
  KEY `active` (`active`)
) ENGINE=InnoDB AUTO_INCREMENT=4629 DEFAULT CHARSET=utf8;
```

### CRMLite_management:

management for the customer did by agent (with or without active interaction).

```sql
CREATE TABLE `CRMLite_management` (
  `id` int(100) UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_customer` int(100) UNSIGNED DEFAULT 0,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `agent` varchar(100) DEFAULT '',
  `lvl1` varchar(100) DEFAULT '',
  `lvl2` varchar(100) DEFAULT '',
  `lvl3` varchar(100) DEFAULT '',
  `note` varchar(800) DEFAULT '',
  `queuename` varchar(100) DEFAULT NULL,
  `channel` varchar(40) DEFAULT NULL,
  `guid` varchar(100) DEFAULT NULL,
  `callid` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Index_channel` (`channel`),
  KEY `Index_lvl1` (`lvl1`),
  KEY `Index_lvl2` (`lvl2`),
  KEY `Index_lvl3` (`lvl2`),
  KEY `Index_results` (`lvl1`,`lvl2`,`lvl3`),
  KEY `Index_queue` (`queuename`),
  KEY `Index_guid` (`guid`),
  KEY `Index_agent` (`agent`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8;
```

## CRMLite files:

Put the folder named "CRMLite" into this path:

```bash
/etc/IntegraServer/web/forms/
```

# Transfer information from the old CRM to CRMLite:

If you are currenty working with the CRM and you want to use the new CRMLite, maybe you want to backup your old information.

Please, follow the order, step by step, to complete this transaction to your new CRMLite

```sql
INSERT INTO ccrepo.CRMLite_customers
(document, name, address, phone, agent, date, country, state, city, field1, field2, field3 )
SELECT documento, nombrecompleto, direccion, tel1, agente, fecha,
pais, estado, ciudad, campolibre1, campolibre2, campolibre3 FROM ccrepo.CRM_Clientes
WHERE tel1 NOT IN (SELECT phone FROM ccrepo.CRMLite_customers)
AND tel1 NOT NULL GROUP BY tel1;
```

```sql
INSERT INTO ccrepo.CRMLite_management
(date, agent, lvl1, lvl2, lvl3, note, queuename, channel, guid, callid)
SELECT fecha, agente, res1, res2, res3, comentarios, campana, "telephony", guid, telMarcado
FROM ccrepo.CRM_Gestiones
WHERE telMarcado IN (SELECT phone FROM ccrepo.CRM_customers);
```

```sql
UPDATE ccrepo.CRMLite_management crml1, ccrepo.CRMLite_customers crml2
SET crml1.id_customer = crml2.id_customer
WHERE crml1.callid = crml2.phone AND crml1.id_customer = 0;
```

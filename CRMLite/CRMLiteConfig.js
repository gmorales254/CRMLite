//# sourceURL=CRMLiteConfig.js

export default async function getConfig(){
    let resp = await UC_get_async('SELECT * FROM CRMLite_features', 'Repo');
    resp = JSON.parse(resp);

    if (!resp.length) return {error: "Without config to load"};

    let objTemp = {};

    resp.map((e)=>{
        objTemp[e.name] = {
            active: e.active,
            val: e.featureVal
        }
    });

    return objTemp;
}


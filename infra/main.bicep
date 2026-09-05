targetScope = 'resourceGroup'

@description('Name of the azd environment.')
param environmentName string

@description('Azure region for the Hackathon Demo resources.')
@allowed([
  'southeastasia'
])
param location string = 'southeastasia'

@description('App Service Plan SKU. B1 supports Always On for a stable live demo.')
@allowed([
  'B1'
])
param appServicePlanSku string = 'B1'

var resourceToken = toLower(uniqueString(subscription().id, resourceGroup().id, environmentName))
var appServicePlanName = 'asp-esp-${environmentName}'
var webAppName = 'app-esp-${environmentName}-${resourceToken}'
var tags = {
  'azd-env-name': environmentName
  application: 'esp'
  'cost-owner': 'Liming'
  environment: 'hackathon-demo'
  'data-classification': 'synthetic-non-sensitive'
  'lifecycle-review-date': '2026-09-18'
  'production-authorized': 'false'
}

module appServicePlan 'br/public:avm/res/web/serverfarm:0.7.0' = {
  name: 'esp-app-service-plan'
  params: {
    name: appServicePlanName
    location: location
    kind: 'linux'
    reserved: true
    skuName: appServicePlanSku
    skuCapacity: 1
    zoneRedundant: false
    tags: tags
  }
}

module webApp 'br/public:avm/res/web/site:0.24.0' = {
  name: 'esp-web-app'
  params: {
    name: webAppName
    kind: 'app,linux'
    location: location
    serverFarmResourceId: appServicePlan.outputs.resourceId
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    basicPublishingCredentialsPolicies: [
      {
        name: 'ftp'
        allow: false
      }
      {
        name: 'scm'
        allow: false
      }
    ]
    configs: [
      {
        name: 'appsettings'
        properties: {
          ESP_DATA_DIR: '/home/data/esp'
          HOST: '0.0.0.0'
          NPM_CONFIG_INCLUDE: 'dev'
          NODE_ENV: 'production'
          POST_BUILD_COMMAND: 'npm prune --omit=dev'
          SCM_DO_BUILD_DURING_DEPLOYMENT: 'true'
        }
      }
    ]
    siteConfig: {
      alwaysOn: true
      appCommandLine: 'cd /home/site/wwwroot && npm start'
      ftpsState: 'Disabled'
      healthCheckPath: '/api/health'
      http20Enabled: true
      linuxFxVersion: 'NODE|24-lts'
      minTlsVersion: '1.2'
      numberOfWorkers: 1
      remoteDebuggingEnabled: false
      scmMinTlsVersion: '1.2'
    }
    tags: union(tags, {
      'azd-service-name': 'web'
    })
  }
}

output AZURE_LOCATION string = location
output AZURE_RESOURCE_GROUP string = resourceGroup().name
output SERVICE_WEB_RESOURCE_NAME string = webAppName
output SERVICE_WEB_URI string = 'https://${webAppName}.azurewebsites.net'
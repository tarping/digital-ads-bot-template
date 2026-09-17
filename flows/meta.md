# Meta Ads · Select

Acción `Select_Meta` del flujo de Power Automate. Lista destino: `meta_ads_data`.
Resto del flujo: el patrón de [`README.md`](../README.md#4-monta-los-flujos-de-power-automate) (Get items → Delete
item → Create item).

Map tal como está en el flujo:

```json
{
  "Platform": "Meta Ads",
  "KnowledgeTitle": "Meta Ads - @{coalesce(item()?['Artist'], '')} - @{coalesce(item()?['Release'], '')} - @{coalesce(item()?['Mes'], '')}",
  "SearchText": "@{toLower(concat(coalesce(item()?['Artist'], ''), ' ', coalesce(item()?['Release'], ''), ' ', coalesce(item()?['Objectivo'], ''), ' ', coalesce(item()?['Objective'], ''), ' ', coalesce(item()?['Segmento'], ''), ' ', coalesce(item()?['PM'], ''), ' ', coalesce(item()?['Mes'], ''), ' ', coalesce(item()?['Campaign ID'], item()?['Campaign_x0020_ID'], ''), ' ', coalesce(item()?['Status'], ''), ' ', coalesce(item()?['Effective Status'], item()?['Effective_x0020_Status'], ''), ' meta ads instagram facebook'))}",
  "KnowledgeSummary": "Campaña de Meta Ads para @{coalesce(item()?['Artist'], '')} / @{coalesce(item()?['Release'], '')}. Objetivo interno: @{coalesce(item()?['Objectivo'], '')}. Objective Meta: @{coalesce(item()?['Objective'], '')}. Segmento: @{coalesce(item()?['Segmento'], '')}. PM: @{coalesce(item()?['PM'], '')}. Mes: @{coalesce(item()?['Mes'], '')}. Campaign ID: @{coalesce(item()?['Campaign ID'], item()?['Campaign_x0020_ID'], '')}. Status: @{coalesce(item()?['Status'], '')}. Effective Status: @{coalesce(item()?['Effective Status'], item()?['Effective_x0020_Status'], '')}. Spend: @{coalesce(item()?['Spend'], '')}. Impressions: @{coalesce(item()?['Impressions'], '')}. Reach: @{coalesce(item()?['Reach'], '')}. Link Clicks: @{coalesce(item()?['Link Clicks'], item()?['Link_x0020_Clicks'], '')}. Results: @{coalesce(item()?['Results'], '')}. Result Type: @{coalesce(item()?['Result Type'], item()?['Result_x0020_Type'], '')}. Cost per Result: @{coalesce(item()?['Cost per Result'], item()?['Cost_x0020_per_x0020_Result'], '')}. Calc Cost per Result: @{coalesce(item()?['CostPerResult'], '')}. Post Engagement: @{coalesce(item()?['Post Engagement'], item()?['Post_x0020_Engagement'], '')}. Bench Cost per Result: @{coalesce(item()?['BENCH Cost Per Result'], item()?['BENCH_x0020_Cost_x0020_Per_x0020_Result'], '')}. %Bench: @{coalesce(item()?['%Bench'], item()?['_x0025_Bench'], '')}.",
  "Artist": "@{coalesce(item()?['Artist'], '')}",
  "Release": "@{coalesce(item()?['Release'], '')}",
  "Objectivo": "@{coalesce(item()?['Objectivo'], '')}",
  "Segmento": "@{coalesce(item()?['Segmento'], '')}",
  "PM": "@{coalesce(item()?['PM'], '')}",
  "Mes": "@{coalesce(item()?['Mes'], '')}",
  "CampaignID": "@{coalesce(item()?['Campaign ID'], item()?['Campaign_x0020_ID'], '')}",
  "Objective": "@{coalesce(item()?['Objective'], '')}",
  "Status": "@{coalesce(item()?['Status'], '')}",
  "EffectiveStatus": "@{coalesce(item()?['Effective Status'], item()?['Effective_x0020_Status'], '')}",
  "Impressions": "@{coalesce(item()?['Impressions'], '')}",
  "Reach": "@{coalesce(item()?['Reach'], '')}",
  "Spend": "@{coalesce(item()?['Spend'], '')}",
  "LinkClicks": "@{coalesce(item()?['Link Clicks'], item()?['Link_x0020_Clicks'], '')}",
  "Results": "@{coalesce(item()?['Results'], '')}",
  "ResultType": "@{coalesce(item()?['Result Type'], item()?['Result_x0020_Type'], '')}",
  "CostPerResult": "@{coalesce(item()?['Cost per Result'], item()?['Cost_x0020_per_x0020_Result'], '')}",
  "CalcCostPerResult": "@{coalesce(item()?['CostPerResult'], '')}",
  "PostEngagement": "@{coalesce(item()?['Post Engagement'], item()?['Post_x0020_Engagement'], '')}",
  "BenchCostPerResult": "@{coalesce(item()?['BENCH Cost Per Result'], item()?['BENCH_x0020_Cost_x0020_Per_x0020_Result'], '')}",
  "PercentBench": "@{coalesce(item()?['%Bench'], item()?['_x0025_Bench'], item()?['PercentBench'], '')}"
}
```

## Notas

- **Nombres con espacios y codificados a la vez** (`Campaign ID` o
  `Campaign_x0020_ID`): el `coalesce` cubre las dos formas que puede devolver
  el conector según la versión.
- **`CalcCostPerResult` sale de la columna `CostPerResult` de la hoja**, que es
  la antigua `(Calc) Cost per Result` renombrada. `CostPerResult` de la lista
  sale de `Cost per Result`, el de Meta. Los nombres se cruzan a propósito.
- **Todas las métricas van como texto** (`@{…}` interpola, no convierte). Si las
  columnas de la lista son Número, SharePoint convierte al guardar; si son
  texto, el bot compara cadenas y `"9" > "10"`. Revisar el tipo de `Spend`,
  `Impressions`, `Reach`, `LinkClicks`, `Results`, `CostPerResult`,
  `CalcCostPerResult`, `BenchCostPerResult` y `PercentBench` en la lista.
- **`Mes` viene hecho de la hoja**, no se calcula aquí.

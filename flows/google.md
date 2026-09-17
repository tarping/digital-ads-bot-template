# Google Ads · Select

Acción `Select_Google` del flujo de Power Automate. Lista destino: `google_ads_data`.
Resto del flujo: el patrón de [`README.md`](../README.md#4-build-the-power-automate-flows) (Get items → Delete
item → Create item).

Map tal como está en el flujo:

```json
{
  "Platform": "Google Ads",
  "KnowledgeTitle": "Google Ads - @{coalesce(item()?['Artist'], item()?['Artista'], '')} - @{coalesce(item()?['Release'], '')} - @{coalesce(item()?['Mes'], '')}",
  "SearchText": "@{toLower(concat(coalesce(item()?['Artist'], item()?['Artista'], ''), ' ', coalesce(item()?['Release'], ''), ' ', coalesce(item()?['Objectivo'], ''), ' ', coalesce(item()?['Segmento'], ''), ' ', coalesce(item()?['PM'], '') , ' ', coalesce(item()?['Mes'], ''), ' ', coalesce(item()?['Campaign ID'], item()?['Campaign_x0020_ID'], item()?['CampaignID'], ''), ' ', coalesce(item()?['Campaign Type'], item()?['Campaign_x0020_Type'], item()?['CampaignType'], ''), ' ', coalesce(item()?['Effective Status'], item()?['Effective_x0020_Status'], item()?['EffectiveStatus'], ''), ' google ads'))}",
  "KnowledgeSummary": "Campaña de Google Ads para @{coalesce(item()?['Artist'], item()?['Artista'], '')} / @{coalesce(item()?['Release'], '')}. Objetivo: @{coalesce(item()?['Objectivo'], '')}. Segmento: @{coalesce(item()?['Segmento'], '')}. PM: @{coalesce(item()?['PM'], '')}. Mes: @{coalesce(item()?['Mes'], '')}. Campaign ID: @{coalesce(item()?['Campaign ID'], item()?['Campaign_x0020_ID'], item()?['CampaignID'], '')}. Tipo de campaña: @{coalesce(item()?['Campaign Type'], item()?['Campaign_x0020_Type'], item()?['CampaignType'], '')}. Estado original: @{coalesce(item()?['Effective Status'], item()?['Effective_x0020_Status'], item()?['EffectiveStatus'], '')}. Spend: @{coalesce(item()?['Spend'], '')}. Impressions: @{coalesce(item()?['Impressions'], '')}. Clicks: @{coalesce(item()?['Clicks'], '')}. CTR: @{coalesce(item()?['CTR (%)'], item()?['CTR_x0020_(%)'], item()?['CTR'], item()?['CTR Calc'], item()?['CTR_x0020_Calc'], '')}. CPC: @{coalesce(item()?['CPC'], '')}. Video Views: @{coalesce(item()?['Video Views'], item()?['Video_x0020_Views'], item()?['VideoViews'], '')}.",
  "Artist": "@{coalesce(item()?['Artist'], item()?['Artista'], '')}",
  "Release": "@{coalesce(item()?['Release'], '')}",
  "Objectivo": "@{coalesce(item()?['Objectivo'], '')}",
  "Segmento": "@{coalesce(item()?['Segmento'], '')}",
  "PM": "@{coalesce(item()?['PM'], '')}",
  "Mes": "@{coalesce(item()?['Mes'], '')}",
  "CampaignID": "@{coalesce(item()?['Campaign ID'], item()?['Campaign_x0020_ID'], item()?['CampaignID'], '')}",
  "CampaignType": "@{coalesce(item()?['Campaign Type'], item()?['Campaign_x0020_Type'], item()?['CampaignType'], '')}",
  "EffectiveStatus": "@{coalesce(item()?['Effective Status'], item()?['Effective_x0020_Status'], item()?['EffectiveStatus'], '')}",
  "Spend": "@{coalesce(item()?['Spend'], '')}",
  "Impressions": "@{coalesce(item()?['Impressions'], '')}",
  "Clicks": "@{coalesce(item()?['Clicks'], '')}",
  "CTR": "@{coalesce(item()?['CTR (%)'], item()?['CTR_x0020_(%)'], item()?['CTR'], '')}",
  "CPC": "@{coalesce(item()?['CPC'], '')}",
  "VideoViews": "@{coalesce(item()?['Video Views'], item()?['Video_x0020_Views'], item()?['VideoViews'], '')}",
  "ViewRate": "@{coalesce(item()?['View Rate (%)'], item()?['View_x0020_Rate_x0020_(%)'], item()?['ViewRate'], '')}",
  "AvgCPV": "@{coalesce(item()?['Avg CPV'], item()?['Avg_x0020_CPV'], item()?['AvgCPV'], '')}",
  "CTRCalc": "@{coalesce(item()?['CTR Calc'], item()?['CTR_x0020_Calc'], item()?['CTRCalc'], '')}",
  "CPCBench": "@{coalesce(item()?['CPC Bench'], item()?['CPC_x0020_Bench'], item()?['CPCBench'], '')}",
  "CTRBench": "@{coalesce(item()?['CTR Bench'], item()?['CTR_x0020_Bench'], item()?['CTRBench'], '')}"
}
```

## Notas

- **El CTR del `KnowledgeSummary` no es el canónico.** El resumen pone `CTR (%)`
  (el de Google) y solo cae a `CTR Calc` si ese falta; el prompt manda usar
  siempre `CTRCalc`. Si el bot cita el CTR leyendo el resumen, dará el otro.
  Cambiar el orden del `coalesce` del resumen a `CTR Calc` primero lo alinea.
- **`CampaignID` se carga** aunque la descripción de la lista no lo menciona.
- **Todas las métricas van como texto** (`@{…}`), igual que Meta: revisar que
  `Spend`, `Impressions`, `Clicks`, `CTR`, `CPC`, `VideoViews`, `ViewRate`,
  `AvgCPV`, `CTRCalc`, `CPCBench` y `CTRBench` sean Número en la lista.
- **`Artist` o `Artista`**: el `coalesce` cubre las dos cabeceras de la hoja.

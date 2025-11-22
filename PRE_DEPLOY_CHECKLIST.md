# Pre-Deploy Checklist ✅

## Secrets
- [ ] ANTHROPIC_API_KEY configurado en producción
- [ ] KAPSO_API_KEY configurado en producción
- [ ] KAPSO_PHONE_NUMBER_ID configurado en producción

## Database
- [ ] Migrations aplicadas correctamente
- [ ] Database backup configurado
- [ ] Connection limits apropiados para producción

## Configuración
- [ ] CORS configurado para dominio de producción
- [ ] Rate limiting habilitado (si es necesario)
- [ ] Logging level configurado (INFO en prod, no DEBUG)

## Testing
- [ ] Tests de integración pasando
- [ ] Onboarding flow probado end-to-end
- [ ] Webhook de Kapso configurado para dominio de producción
- [ ] Landing page testeada en producción

## Monitoring
- [ ] Logs configurados (Encore Cloud o servicio externo)
- [ ] Alertas configuradas para errores críticos
- [ ] Dashboard de monitoreo accesible

## Performance
- [ ] Agent SDK max_turns apropiado (15 parece bien)
- [ ] Database queries optimizadas con índices
- [ ] Session timeout configurado (2 horas actual)

## Security
- [ ] Secrets nunca en código (solo via encore secret)
- [ ] HTTPS habilitado
- [ ] Rate limiting en webhooks (si es necesario)
- [ ] Validación de webhooks de Kapso (verificar firma)

-- Función optimizada para obtener catálogos de orden en una sola llamada
create or replace function get_catalogos_orden()
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'tipos', (
      select coalesce(json_agg(nombre order by veces_usado desc), '[]'::json)
      from tipos_equipos 
      where activo = true
    ),
    'marcas', (
      select coalesce(json_agg(distinct marca), '[]'::json)
      from marcas_modelos 
      where activo = true
    ),
    'modelos', (
      select coalesce(json_agg(distinct modelo), '[]'::json)
      from marcas_modelos 
      where activo = true
    )
  ) into result;

  return result;
end;
$$ language plpgsql security definer;

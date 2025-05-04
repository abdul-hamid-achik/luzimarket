import TablaAdmision from "@/components/peticiones/admisiones/cuerpo_admisiones";
import BreadCrumb from "@/components/breadcrumb";
import { useBranchPetitions } from '@/api/hooks';

const tablaSucursales = () => {
  const { data: branches = [], isLoading } = useBranchPetitions();
  const items = [
    { name: "Peticiones", link: "/inicio/peticiones" },
    { name: "Sucursales", link: "/inicio/peticiones/sucursales" },
  ];

  return (
    <div className="mt-5 ms-5 w-100 p-5">
      <BreadCrumb items={items} activeItem={"Sucursales"} />
      <div className="container p-5">
        <table className="table table-borderless">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Fecha de creación</th>
            </tr>
          </thead>
          <tbody>
            {(isLoading || branches.length === 0) ? (
              <tr>
                <td colSpan={3} className="text-center text-secondary">
                  {isLoading ? 'Cargando sucursales...' : 'No hay sucursales.'}
                </td>
              </tr>
            ) : (
              branches.map((b) => (
                <tr key={b.id}>
                  <td>
                    <input type="text" className="form-control" value={b.name} readOnly />
                  </td>
                  <td>
                    <input type="text" className="form-control" value={b.address} readOnly />
                  </td>
                  <td>
                    <input type="text" className="form-control" value={b.createdAt} readOnly />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default tablaSucursales;

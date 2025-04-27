import Annual from "import../";
import Earnings from "import../";
import Overview from "import../";

const Dashboard = () => {
  return (
    <div className="container d-flex align-items-center justify-content-center">
      <div className="row">
        <div className="col-lg-4 mb-3">
          <Annual />
        </div>
        <div className="col-lg-4 mb-3">
          <Earnings />
        </div>
        <div className="col-lg-4 mb-3">
          <Overview />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;

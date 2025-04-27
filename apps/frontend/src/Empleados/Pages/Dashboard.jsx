import Annual from "import../";
import Earnings from "import../";
import Overview from "import../";

const Dashboard = () => {
  return (
    <div className="Dashboard container p-4">
      <div className="row">
        <div className="col-md-4 mb-3">
          <Annual />
        </div>
        <div className="col-md-4 mb-3">
          <Earnings />
        </div>
        <div className="col-md-4 mb-3">
          <Overview />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;

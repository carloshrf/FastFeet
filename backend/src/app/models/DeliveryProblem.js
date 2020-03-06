import Sequelize, { Model } from 'sequelize';

class Delivery_problem extends Model {
  static init(sequelize) {
    super.init(
      {
        description: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );
    return this;
  }

  static associate(model) {
    this.belongsTo(model.Order, { foreignKey: 'order_id', as: 'order' });
  }
}

export default Delivery_problem;

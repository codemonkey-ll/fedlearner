module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('Ticket', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    federation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'federations',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    job_type: {
      type: DataTypes.STRING(16),
      allowNull: false,
      comment: 'data_join | psi_data_join | tree_model | nn_model',
    },
    role: {
      type: DataTypes.STRING(16),
      allowNull: false,
      comment: 'leader | follower',
    },
    sdk_version: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'docker image tag',
    },
    expire_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      default: null,
    },
    public_params: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      default: null,
    },
    private_params: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      default: null,
    },
  }, {
    tableName: 'tickets',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    getterMethods: {
      public_params() {
        const val = this.getDataValue('public_params');
        if (val) return JSON.parse(val);
        return null;
      },
      private_params() {
        const val = this.getDataValue('private_params');
        if (val) return JSON.parse(val);
        return null;
      },
    },
    setterMethods: {
      public_params(value) {
        this.setDataValue('public_params', value ? JSON.stringify(value) : null);
      },
      private_params(value) {
        this.setDataValue('private_params', value ? JSON.stringify(value) : null);
      },
    },
  });

  Ticket.associate = (models) => {
    Ticket.belongsTo(models.Federation, { as: 'federation', foreignKey: 'federation_id' });
    Ticket.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' });
  };

  return Ticket;
};

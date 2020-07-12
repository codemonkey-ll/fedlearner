module.exports = (sequelize, DataTypes) => {
  const RawData = sequelize.define('RawData', {
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
      comment: 'unique, used for application scheduler',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    input: {
      type: DataTypes.STRING(2083),
      allowNull: false,
      comment: 'root URI of data portal input',
    },
    output: {
      type: DataTypes.STRING(2083),
      allowNull: false,
      comment: 'root URI of data portal output',
    },
    output_partition_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'output partition num',
    },
    data_portal_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'data portal type',
    },
    context: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      default: null,
      comment: 'k8s YAML and job information',
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      default: null,
    },
    k8s_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
      default: null,
    },
  }, {
    tableName: 'raw_datas',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    getterMethods: {
      context() {
        const val = this.getDataValue('context');
        if (val) return JSON.parse(val);
        return null;
      },
    },
    setterMethods: {
      context(value) {
        this.setDataValue('context', value ? JSON.stringify(value) : null);
      },
    },
  });

  RawData.associate = (models) => {
    RawData.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' });
  };

  return RawData;
};

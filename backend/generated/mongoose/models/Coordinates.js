const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Coordinates Mongoose Schema
 * Auto-generated from mogao_dt.ecore metamodel
 * Inheritance chain: DTElement -> UtilityElement -> Coordinates
 * All inherited properties are flattened into this schema.
 */
const CoordinatesSchema = new Schema({
    gid: { type: String, required: true, unique: true },
    x: { type: Number },
    y: { type: Number },
    z: { type: Number },
    roll: { type: Number },
    pitch: { type: Number },
    yaw: { type: Number },
}, {
    timestamps: true,
    collection: 'coordinates'
});

const Coordinates = mongoose.model('Coordinates', CoordinatesSchema);

module.exports = { Coordinates, CoordinatesSchema };


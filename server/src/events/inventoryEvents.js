const EventEmitter = require('events');

class InventoryEventEmitter extends EventEmitter {}

const inventoryEvents = new InventoryEventEmitter();

// Event types
const EVENTS = {
  INVENTORY_UPDATED: 'inventory:updated',
  PRODUCT_SOLD: 'product:sold',
  PRODUCT_ADDED: 'product:added',
  PRODUCT_DELETED: 'product:deleted'
};

module.exports = { inventoryEvents, EVENTS };

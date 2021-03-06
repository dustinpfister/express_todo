let path = require('path'),
fs = require('fs-extra'),
FileAsync = require('lowdb/adapters/FileAsync'),
low = require('lowdb'),
shortId = require('shortid');

// okay just do this for now.
let dir_db = 'db',
path_lists = path.join(dir_db, 'lists.json');

/********* ********** **********
HELPER
 ********** ********** *********/

// ensure db folder, and default list.json
exports.ensureDB = function () {

    let listAdapter = new FileAsync(path_lists);

    return fs.ensureDir(dir_db).then(function () {

        return low(listAdapter).then(function (list) {

            return list.defaults({
                lists: []
            }).write();

        })

    });

};

/********* ********** **********
LISTS
 ********** ********** *********/

// read the lists
exports.readLists = function () {

    let listAdapter = new FileAsync(path_lists);

    return low(listAdapter);

};

// push new list
exports.pushList = function (obj) {

    obj = obj || {};

    obj.name = obj.name || 'new list';

    return this.readLists().then(function (lists) {

        let list = {

            name: obj.name,
            id: shortId.generate(),
            created: new Date(),
            items: []

        };

        return lists.get('lists').push(list).write().then(function () {

            return list;

        });

    });

};

// getListById
exports.getListById = function (id) {

    return this.readLists().then(function (lists) {

        return lists.get('lists').find({
            id: id
        });

    }).then(function (list) {

        // sort by done
        return list.assign({

            items: list.get('items').sortBy(function (item) {

                return !item.done;

            }).value()
        });

    });

};

// delete a list by listId
exports.deleteListById = function (obj) {

    return this.readLists().then(function (db) {

        return db.get('lists').remove({

            id: obj.listId

        }).write();

    });

};

/********* ********** **********
ITEM
 ********** ********** *********/

// get an item by list and item id
exports.getItemById = function (obj) {

    return this.getListById(obj.listId).then(function (list) {

        return list.get('items').find({
            id: obj.itemId
        });

    });

};

// edit an item by list and item id
exports.editItemById = function (obj) {

    return this.getListById(obj.listId).then(function (list) {

        let item = list.get('items').find({
                id: obj.itemId
            });

        return item.assign({

            // set created date if it is not there to begin with
            // (updating a list from (express_todo 0.0.x)
            created: item.value().created ? item.value().created : new Date()

        }).write().then(function () {

            // toggle done flag
            if (obj.toggleDone) {

                return item.assign({
                    done: !item.value().done ? new Date() : false
                }).write();

            }

            // just return the item then
            return item.write();

        }).catch (function (e) {

            // just return the item then
            return item.write();

        })

            /*
            var item = list.get('items').find({
            id: obj.itemId
            }).assign({
            created: item.value().created ? item.value().created : new Date()
            });

            // toggle done flag?
            if (obj.toggleDone) {

            return item.assign({
            done: !item.value().done ? new Date() : false
            }).write();

            } else {

            // then direct edit, if we have an item object to do so with
            if (obj.item) {
            return item.assign(obj.item).write();
            }

            }

            // if this happens just return a promise,
            // and change nothing.
            return item.write();
             */

    });

};

// get an item by list and item id
exports.deleteItemById = function (obj) {

    return this.getListById(obj.listId).then(function (list) {

        return list.get('items').remove({
            id: obj.itemId
        }).write();

    });

};

// push a new item to a list
exports.pushItem = function (obj) {

    return this.getListById(obj.listId).then(function (list) {

        obj.item.id = shortId.generate();
        obj.item.done = false;
        obj.item.created = new Date();

        return list.get('items').push(obj.item).write();

    });

};

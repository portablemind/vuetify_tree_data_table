/**
* This component handles rendering a tree view in a data grid
*/

<template>
  <div class="v-tree-data-table">
    <v-data-table ref="dataTable" :headers="computedHeaders" :items="flattenedNodes" :pagination.sync="internalPagination" :total-items="totalItems" :loading="loading">
      <template slot="items" slot-scope="{ item, index }">
        <tr v-if="index == 0" class="drop-row inactive" @dragenter.stop.prevent="dragEnterSlot($event)" @dragleave.stop.prevent="dragLeaveSlot($event)" @drop.stop.prevent="dropRow($event)" @dragover.stop="dragOverSlot($event)">
          <td :colspan="computedHeaders.length"></td>
        </tr>

        <tr v-if="item.leaf" class="leaf" @dblclick="(e)=>{$emit('dblclick', e, item)}" @contextmenu.prevent="(e)=>{$emit('contextmenu', e, item)}" :key="item.id" :id="item.id" :style="nodeHidden(item)" @dragenter.stop.prevent="dragEnterLeaf($event)" @dragleave.stop.prevent="dragLeaveLeaf($event)" @drop.stop.prevent="dropRow($event)" @dragover.stop="dragOverLeaf($event)">
          <td class="px-1" style="width: 0.1%">
            <v-btn style="cursor: move" icon class="sort-handle" @dragstart.stop="dragStart($event)" @dragend.stop.prevent="dragEnd" draggable>
              <v-icon>drag_handle</v-icon>
            </v-btn>
          </td>
          <td v-if="item.leaf" class="expandable-node" :style="nodeStyle(item)">
            <v-icon>keyboard_arrow_right</v-icon>
          </td>
          <td v-else class="expandable-node" @click="toggleNode(item)" :style="nodeStyle(item)">
            <v-icon>{{expandable_icon(item)}}</v-icon>
          </td>
          <slot name="row" :record="item"></slot>
        </tr>

        <tr v-if="!item.leaf" class="folder" @dblclick="(e)=>{$emit('dblclick', e, item)}" @contextmenu.prevent="(e)=>{$emit('contextmenu', e, item)}" :key="item.id" :id="item.id" :style="nodeHidden(item)" @dragenter.stop.prevent="dragEnterFolder($event)" @dragleave.stop.prevent="dragLeaveFolder($event)" @drop.stop.prevent="dropRow($event)" @dragover.stop="dragOverFolder($event)">
          <td class="px-1" style="width: 0.1%">
            <v-btn style="cursor: move" icon class="sort-handle" @dragstart.stop="dragStart($event)" @dragend.stop.prevent="dragEnd" draggable>
              <v-icon>drag_handle</v-icon>
            </v-btn>
          </td>
          <td v-if="item.leaf" class="expandable-node" :style="nodeStyle(item)">
            <v-icon>keyboard_arrow_right</v-icon>
          </td>
          <td v-else class="expandable-node" @click="toggleNode(item)" :style="nodeStyle(item)">
            <v-icon>{{expandable_icon(item)}}</v-icon>
          </td>
          <slot name="row" :record="item"></slot>
        </tr>

        <tr class="drop-row inactive" @dragenter.stop.prevent="dragEnterSlot($event)" @dragleave.stop.prevent="dragLeaveSlot($event)" @drop.stop.prevent="dropRow($event)" @dragover.stop="dragOverSlot($event)">
          <td :colspan="computedHeaders.length"></td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import nodeHelper from './nodeHelper.js';

export default {
  props: {
    headers: {
      type: Array,
      default: [],
      required: true,
    },
    items: {
      type: Array,
      default: [],
      required: true,
    },
    pagination: {
      type: Object,
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
  },

  mounted: function() {
    this.setupDragGhosts();
  },

  data: function() {
    return {
      internalPagination: {},
      flattenedNodes: [],

      overFolder: null,
      draggedNode: null,
      newParentNode: null,
    };
  },

  watch: {
    internalPagination() {
      // when pagination is changed emit a load
      this.$emit('load', this.internalPagination);
    },
    items() {
      this.flattenNodes();
    },
  },

  computed: {
    computedHeaders() {
      let headers = this.headers;

      headers.unshift({
        text: ' ',
        value: 'sortable',
        sortable: false,
      });

      return headers;
    },
  },

  methods: {
    /*
    Setup drag ghost images
    */
    setupDragGhosts: function() {
      this.folderClosedDragGhost = new Image();
      this.folderClosedDragGhost.src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfiCAEBCADWj9yyAAAAu0lEQVQ4y+2SoQ6CUBSGv3txXDdnkKQ0M0W5L+BD2Ay+h02fwDcw2Y0m5wsAyWKy0WgGYICFWZQBwY3g/7d//3d2znagcxJzRlxwLWG+syKPgrQK6AWAXrPBpiizTOzZuvhfAQO04sQUE1W6LxYT6V8/y5oQAXrInXHd7sVTLL0zyMbHDjhoswUAgGoL8Ad+B+Si+W+DBBmTNapnxGBAmNkRDoqYpNIpD3aeB2KGwxFtYdbMT7xoxY0O6gWXGzUrgZScUAAAAABJRU5ErkJggg==';
      this.folderClosedDragGhost.height = '24';
      this.folderClosedDragGhost.width = '24';

      this.folderOpenDragGhost = new Image();
      this.folderOpenDragGhost.src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfiCAEBDiyyDRfXAAAAe0lEQVQ4y2NgGPqAkYGBgcHYm2ElAzdC8H/DuUZcGpgZGBgYpC4gK2dgYHSQZHx+AJ8N/4lwy1eGiLNbGBiYYK4gqIGLYQ0DAwMDC8yms4z41Rv/Z2BnYEDYQDQY1TA4NEBi+gcDO8H09J/hJ8KGUIZvBI3+xhDKMEwAADaQFZcd2zJpAAAAAElFTkSuQmCC';
      this.folderOpenDragGhost.height = '24';
      this.folderOpenDragGhost.width = '24';

      this.leafDragGhost = new Image();
      this.leafDragGhost.src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfiCAEBCCN06K3AAAAAZElEQVQ4y+3TsQmAUAxF0avD/EYEzRvBLSzEHdSRFK0dMPaC8INgZcpwTxMI/AMVAE2E2Gp7gFiSy20LkFZxYl8Q1XK5Hfd9+Sg6gOLMvdUkl1ufm8+xfAnlSqEcwAaN/0+9mwuzISU1axeSPQAAAABJRU5ErkJggg==';
      this.leafDragGhost.height = '24';
      this.leafDragGhost.width = '24';
    },

    /**
     * dragStart handler
     * @param {Event} event Browser Event
     */
    dragStart(event) {
      const draggedNodeId = $(event.target)
        .closest('tr')
        .attr('id');

      this.draggedNode = this.flattenedNodes.filter(_node => {
        return _node.id == draggedNodeId;
      })[0];

      if (this.draggedNode.leaf) {
        event.dataTransfer.setDragImage(this.leafDragGhost, -24, -24);
      } else if (this.draggedNode.expanded) {
        event.dataTransfer.setDragImage(this.folderOpenDragGhost, -24, -24);
      } else {
        event.dataTransfer.setDragImage(this.folderClosedDragGhost, -24, -24);
      }
    },

    /**
     * dragEnd handler, clears all active rows
     */
    dragEnd() {
      this.clearActive();
    },

    /*
    * Slots
    */

    /**
     * dragEnter handler for a slot
     * @param {Event} event Browser Event
     */
    dragEnterSlot(event) {
      const $target = $(event.target);

      this.clearActive();

      if (
        ($target.parents('.drop-row').length > 0 ||
          $target.hasClass('.drop-row')) &&
        this.draggedNode
      ) {
        if (
          parseInt(
            $target
              .parents('.drop-row')
              .prev()
              .attr('id')
          ) != this.draggedNode.id &&
          parseInt(
            $target
              .parents('.drop-row')
              .next()
              .attr('id')
          ) != this.draggedNode.id
        ) {
          $target.parents('.drop-row').removeClass('inactive');
          $target.parents('.drop-row').addClass('active');
        }
      }
    },

    /**
     * dragLeave event handler for a slot
     * @param {Event} event Browser Event
     */
    dragLeaveSlot(event) {
      $(event.target)
        .parents('.drop-row')
        .removeClass('active');
      $(event.target)
        .parents('.drop-row')
        .addClass('inactive');
    },

    /**
     * dragOver event handler for a slot
     * @param {Event} event Browser Event
     */
    dragOverSlot(event) {
      const $target = $(event.target);

      if (
        this.draggedNode &&
        parseInt(
          $target
            .parents('.drop-row')
            .prev()
            .attr('id')
        ) != this.draggedNode.id &&
        parseInt(
          $target
            .parents('.drop-row')
            .next()
            .attr('id')
        ) != this.draggedNode.id
      ) {
        event.preventDefault();
      }
    },

    /*
    * Folders
    */

    /**
     * dragEnter event handler for a folder
     * @param {Event} event Browser Event
     */
    dragEnterFolder(event) {
      const $target = $(event.target);

      this.clearActive();

      this.overFolder = $target.parents('.folder')[0];

      if (this.overFolder) {
        if (this.draggedNode && this.draggedNode.parentNode) {
          if (
            $target.parents('.folder').attr('id') !=
              this.draggedNode.parentNode.id &&
            $target.parents('.folder').attr('id') != this.draggedNode.id
          ) {
            $target.parents('.folder').addClass('active');
          }
        } else if (
          $target.parents('.folder').attr('id') != this.draggedNode.id
        ) {
          $target.parents('.folder').addClass('active');
        }
      }
    },

    /**
     * dragLeave event handler for a folder
     * @param {Event} event Browser Event
     */
    dragLeaveFolder(event) {
      const $target = $(event.relatedTarget);

      if (this.overFolder) {
        if (!$.contains(this.overFolder, $target[0])) {
          $(this.overFolder).removeClass('active');
          this.overFolder = null;
        }
      }
    },

    /**
     * dragOver event handler for a folder
     * @param {Event} event Browser Event
     */
    dragOverFolder(event) {
      const $target = $(event.target);

      if (this.draggedNode) {
        if (
          $target.parents('.folder').attr('id') !=
            this.draggedNode.parentNode.id &&
          $target.parents('.folder').attr('id') != this.draggedNode.id
        ) {
          event.preventDefault();
        } else if (
          $target.parents('.folder').attr('id') != this.draggedNode.id
        ) {
          event.preventDefault();
        }
      }
    },

    /*
    * Leaves
    */

    /**
     * dragEnter event handler for a leaf
     * @param {Event} event Browser Event
     */
    dragEnterLeaf(event) {
      const $target = $(event.target);

      this.clearActive();

      this.overFolder = $target.parents('.leaf')[0];

      if (this.draggedNode) {
        if (
          $target.parents('.leaf').attr('id') !=
            this.draggedNode.parentNode.id &&
          $target.parents('.leaf').attr('id') != this.draggedNode.id
        ) {
          $target.parents('.leaf').addClass('active');
        } else if ($target.parents('.leaf').attr('id') != this.draggedNode.id) {
          $target.parents('.leaf').addClass('active');
        }
      }
    },

    /**
     * dragLeave event handler for a leaf
     * @param {Event} event Browser Event
     */
    dragLeaveLeaf(event) {
      const $target = $(event.relatedTarget);

      if (this.overFolder) {
        if (!$.contains(this.overFolder, $target[0])) {
          $(this.overFolder).removeClass('active');
          this.overFolder = null;
        }
      }
    },

    /**
     * dragOver event handler for a leaf
     * @param {Event} event Browser Event
     */
    dragOverLeaf(event) {
      const $target = $(event.target);

      if (this.draggedNode) {
        if (this.draggedNode.parentNode) {
          if (
            $target.parents('.leaf').attr('id') !=
              this.draggedNode.parentNode.id &&
            $target.parents('.leaf').attr('id') != this.draggedNode.id
          ) {
            event.preventDefault();
          }
        } else if ($target.parents('.leaf').attr('id') != this.draggedNode.id) {
          event.preventDefault();
        }
      }
    },

    /**
     * drop event handler
     * @param {Event} event Browser Event
     */
    dropRow(event) {
      const $target = $(event.target);

      if ($target.parents('.folder').length > 0) {
        const parentNodeId = $(event.target)
          .parents('.folder')
          .attr('id');

        this.newParentNode = this.flattenedNodes.filter(_node => {
          return _node.id == parentNodeId;
        })[0];

        $(this.overFolder).removeClass('active');
      } else if ($target.parents('.leaf').length > 0) {
        const parentNodeId = $(event.target)
          .parents('.leaf')
          .attr('id');

        this.newParentNode = this.flattenedNodes.filter(_node => {
          return _node.id == parentNodeId;
        })[0];

        $(this.overFolder).removeClass('active');
      } else {
        const previousSiblingId = $(event.target)
          .parents('.drop-row')
          .prev()
          .attr('id');
        const nextSiblingId = $(event.target)
          .parents('.drop-row')
          .next()
          .attr('id');

        this.previousSibling = this.flattenedNodes.filter(_node => {
          return _node.id == previousSiblingId;
        })[0];
        this.nextSibling = this.flattenedNodes.filter(_node => {
          return _node.id == nextSiblingId;
        })[0];

        // remove drag classes
        $(event.target)
          .parents('.drop-row')
          .removeClass('active');
        $(event.target)
          .parents('.drop-row')
          .addClass('inactive');
      }

      this.processDrop();
    },

    /**
     * Process the drop event, move node if needed
     */
    processDrop() {
      if (this.draggedNode) {
        const oldParent = this.draggedNode.parentNode;

        if (this.newParentNode) {
          nodeHelper.moveNode(this.draggedNode, this.newParentNode);

          this.overFolder = null;
          this.newParentNode = null;
        } else {
          let currentIndex = this.flattenedNodes.indexOf(this.draggedNode);
          let newIndex = 0;

          this.flattenedNodes.splice(currentIndex, 1);

          if (this.previousSibling) {
            newIndex = this.flattenedNodes.indexOf(this.previousSibling) + 1;

            // If the previous sibilings parent is not the same as the dragged nodes parent then
            // we need to move the dragged node to the parent
            if (
              this.nextSibling &&
              this.nextSibling.parentNode &&
              this.draggedNode.parentNode &&
              this.draggedNode.parentNode.id &&
              this.nextSibling.parentNode.id != this.draggedNode.parentNode.id
            ) {
              nodeHelper.moveNode(
                this.draggedNode,
                this.nextSibling.parentNode
              );
            }

            if (
              this.nextSibling &&
              this.draggedNode.position > this.nextSibling.position
            ) {
              this.draggedNode.position = this.nextSibling.position;
            } else if (this.previousSibling) {
              this.draggedNode.position = this.previousSibling.position;
            } else {
              this.draggedNode.position = 0;
            }
          } else {
            if (this.draggedNode.parentNode) {
              this.draggedNode.parentNode.children.splice(
                this.draggedNode.parentNode.children.indexOf(this.draggedNode),
                1
              );
              this.draggedNode.parentNode = null;
              this.draggedNode.depth = 1;
            }
          }

          this.flattenedNodes.splice(newIndex, 0, this.draggedNode);
        }

        this.flattenNodes(this.unFlattenNodes());

        this.$emit('drop', this.draggedNode, oldParent, this.unFlattenNodes());

        this.draggedNode = null;
      }
    },

    /**
     * Get the icon for the node
     * @param {Object} node The Node
     */
    expandable_icon(node) {
      if (node.expanded) {
        return 'folder_open';
      } else {
        return 'folder';
      }
    },

    /**
     * Get the style padding for the node
     * @param {Object} node The Node
     */
    nodeStyle(node) {
      return {
        paddingLeft: 8 + 12 * node.depth + 'px',
      };
    },

    /**
     * Flatten nested nodes
     */
    flattenNodes(nodes) {
      nodes = nodes || this.items;

      this.flattenedNodes = nodeHelper.flattenNodes(nodes);
    },

    /**
     * UnFlatten flattend nodes
     */
    unFlattenNodes() {
      return nodeHelper.unFlattenNodes(this.flattenedNodes);
    },

    /**
     * Determine if a node should be hidden
     * @param {Object} node The Node
     */
    nodeHidden(node) {
      if (!node.parentNode) {
        return null;
      } else if (node.parentNode.expanded) {
        return null;
      } else {
        return 'display:none;';
      }
    },

    /**
     * Toggle node from expanded
     * @param {Object} node The Node
     */
    toggleNode(node) {
      node.expanded = !node.expanded;

      if (!node.expanded) this.collapseChildren(node);

      this.$emit('node-toggle', node);
    },

    /**
     * Collapse all nodes children
     * @param {Object} node The Node
     */
    collapseChildren(node) {
      let vm = this;

      node.expanded = false;

      node.children.forEach(child => {
        vm.collapseChildren(child);
      });
    },

    /*
    * Helpers
    */

    /**
     * Clear any active classes
     */
    clearActive() {
      $(this.$el)
        .find('.active')
        .removeClass('active');
    },
  },
};
</script>

<style>
.v-tree-data-table .folder {
  cursor: pointer;
}
.v-tree-data-table .drag * {
  pointer-events: none;
}
.v-tree-data-table .inactive {
  border: none !important;
  height: 5px;
  background-color: transparent !important;
}
.v-tree-data-table .inactive td {
  height: 5px !important;
}
.v-tree-data-table .active {
  background-color: green !important;
}
.v-tree-data-table .active td {
  height: 15px !important;
}
.v-tree-data-table .sort-handle {
  cursor: move;
}
</style>
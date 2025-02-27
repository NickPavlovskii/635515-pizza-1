﻿import pizza from "@/static/pizza.json";

import { extendIngredient /*, capitalize */ } from "@/common/helpers";
import PositionTypes from "@/common/enums/positionTypes";
import SauceNames from "@/common/enums/sauceNames";
import SizeNames from "@/common/enums/sizeNames";

import { extendDough } from "@/common/helpers";
import { hiddenError, hiddenWarning, filterSelected } from "@/common/helpers";
import {
  ADD_POSITION,
  REMOVE_POSITION,
  RESET_BUILDER,
  SET_PIZZA,
} from "@/store/mutation-types";

// const entity = 'columns';
// const module = capitalize(entity);
// const namespace = { entity, module };

const setupState = () => ({
  sauces: pizza.sauces.map((sauce) => ({
    ...sauce,
    internalName: SauceNames[sauce.name],
    type: PositionTypes.Sauce,
  })),
  sizes: pizza.sizes.map((size) => ({
    ...size,
    internalName: SizeNames[size.multiplier],
    type: PositionTypes.Size,
  })),
  doughOptions: pizza.dough.map(extendDough),
  ingredients: pizza.ingredients.map(extendIngredient),

  ingredientsSet: {
    id: null,
    positions: [],
    metadata: [
      {
        internalName: "pizzaName",
        displayName: "Название пиццы",
        value: "",
        required: true,
      },
    ],
    count: 1,
  },
});

const getSelectedInternalName = (positions, type) => {
  const ret = filterSelected(positions, type);
  return ret !== null ? ret.internalName : "";
};

export default {
  namespaced: true,
  state: setupState(),

  getters: {
    selectedDough({ ingredientsSet }) {
      return getSelectedInternalName(
        ingredientsSet.positions,
        PositionTypes.Dough
      );
    },
    selectedSize({ ingredientsSet }) {
      return getSelectedInternalName(
        ingredientsSet.positions,
        PositionTypes.Size
      );
    },
    selectedSauce({ ingredientsSet }) {
      return getSelectedInternalName(
        ingredientsSet.positions,
        PositionTypes.Sauce
      );
    },
    addedIngredients({ ingredients }) {
      return ingredients.filter((ingredient) => ingredient.count > 0).slice();
    },
  },

  mutations: {
    [ADD_POSITION](state, position) {
      if (!("price" in position || "multiplier" in position)) {
        hiddenError(
          `Mutation ${ADD_POSITION} passed an object with the wrong structure. The object must contain a price or multiplier field.`
        );
        return;
      }

      state.ingredientsSet.positions = [
        ...state.ingredientsSet.positions,
        position,
      ];
    },
    [REMOVE_POSITION](state, position) {
      const { positions } = state.ingredientsSet;
      if (positions.length === 0) {
        hiddenWarning(
          `The collection of positions has already been cleared. Internal name ${position.internalName}`
        );
        return;
      }

      const findedPositions = positions.filter(
        (item) => item.internalName !== position.internalName
      );
      if (findedPositions.length === positions.length) {
        hiddenWarning(
          `Event RemovePosition passed an wrong object. The collection has no such object. Internal name ${position.internalName}`
        );
        return;
      }

      state.ingredientsSet.positions = findedPositions;
    },
    [SET_PIZZA](state, pizza) {
      state.ingredientsSet = { ...pizza };
      pizza.positions
        .filter((pos) => pos.type == PositionTypes.Ingredient)
        .forEach((pos) => {
          state.ingredients
            .filter((ing) => ing.internalName == pos.internalName)
            .forEach((current) => (current.count = pos.count));
        });
    },
    [RESET_BUILDER](state) {
      Object.assign(state, setupState());
    },
  },
};

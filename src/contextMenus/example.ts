export const menuex = [
  {
    type: "text",
    onClick: () => {
      console.log("A clicked");
    },
    sub: [
      {
        type: "text",
        onClick: () => {
          console.log("A clicked");
        },
        text: "a jkljkl",
      },
      {
        type: "text",
        sub: [
          {
            type: "text",
            onClick: () => {
              console.log("A clicked");
            },
            text: "a jkljkl",
          },
          {
            type: "text",
            onClick: () => {
              console.log("B clicked");
            },
            text: "b jkljkl",
          },
          {
            type: "text",
            onClick: () => {
              console.log("C clicked");
            },
            text: "c jkljkl",
          },
          {
            type: "text",
            onClick: () => {
              console.log("D clicked");
            },
            text: "d jkljkl",
          },
        ],
        onClick: () => {
          console.log("B clicked");
        },
        text: "b jkljkl",
      },
      {
        type: "text",
        onClick: () => {
          console.log("C clicked");
        },
        text: "c jkljkl",
      },
      {
        type: "text",
        onClick: () => {
          console.log("D clicked");
        },
        text: "d jkljkl",
      },
    ],
    text: "Ajkljkl",
  },
  {
    type: "text",
    onClick: () => {
      console.log("B clicked");
    },
    text: "Bjkljkl",
  },
  {
    type: "text",
    onClick: () => {
      console.log("C clicked");
    },
    text: "Cjkljkl",
  },
  {
    type: "text",
    onClick: () => {
      console.log("D clicked");
    },
    text: "Djkljkl",
  },
];

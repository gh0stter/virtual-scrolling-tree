var require = {
    baseUrl: "src",
    paths: {
        "presenter": "../node_modules/presenter/presenter",
        "text": "../node_modules/text/text"
    },
    packages: [
        // Paths are only used for translation.
        // Packages on the other hand are also used for resolving to a main file.

        // TODO: Check with latest Lamda if this still works, same with optimizer
        {name: "virtual-scrolling-tree", main: "VirtualScrollingTree"}
    ],
    modules: [
        {
            name: "virtual-scrolling-tree",
            location: "virtual-scrolling-tree/VirtualScrollingTree",
            exclude: ["text", "presenter"]
        }
    ]
};
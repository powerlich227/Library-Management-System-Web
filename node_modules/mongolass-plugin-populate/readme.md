## mongolass-plugin-populate

```js
const users = await User
  .find()
  .populate([
    { path: 'aId', model: 'A', as: 'a' }, // parallel
    { path: 'bId', model: 'B', as: 'b' } // parallel
  ])
  .populate({ path: 'a.author', select: { name: 1, avatar: 1 }, model: 'User' }) // series
```

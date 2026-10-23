# Lab1 Phase 1 功能验收清单

> 状态说明：本清单在阶段 1 建立，除“工程与流程”外均为后续阶段的验收契约，不代表功能已经实现。各阶段完成后应更新证据和状态，不得提前勾选。

## 1. 工程与架构

- [x] 使用 TypeScript，启用严格类型检查。
- [x] 提供 `npm run build`、`npm run cli`、`npm test` 三个入口。
- [x] 按领域、应用、SVG 适配、CLI 分层建立目录。
- [ ] 实现类封装、继承与多态；每个业务类独立文件且文件名与类名一致。
- [ ] 实现 Command 模式，编辑命令支持 undo/redo。
- [ ] 实现 Composite 语义，容器与叶子的 `move`、`scale`、`set`、`delete` 用法一致。
- [ ] 按名称分派只出现在命令注册表和图形工厂中，不使用散落的 `switch(tag)`。
- [ ] `domain` 不依赖 `application`、`svg` 或 `cli`。
- [ ] Phase 1 内核不实现 `box` 插件。
- [ ] 每阶段独立提交，提交前运行测试并检查 `git diff`。

## 2. 文档生命周期

- [ ] `init [w] [h]` 新建画布，默认尺寸为 800×600。
- [ ] `read <file.svg>` 读取 SVG；缺失 id 时按 `标签名+序号` 分配并逐条打印警告。
- [ ] `read` 能保留图形层级、绘制顺序、ID、几何属性和可支持样式。
- [ ] `save [file.svg]` 保存到指定路径；省略路径时保存到最近一次 `read` 的路径。
- [ ] SVG 保存后可被合法 XML 解析，并能由本程序读回。
- [ ] `canvas [w] [h]` 无参数显示尺寸，带参数修改尺寸。
- [ ] 未执行 `init`/`read` 时，其他命令统一报 `error: no document. use 'init' or 'read' first`。
- [ ] `init`、`read`、`save` 和 `canvas` 修改尺寸后，禁用 undo/redo，直到下一次成功编辑。

## 3. 图形创建与属性

- [ ] `create` 支持 `rect`、`circle`、`ellipse`、`line`、`text`、`g` 六种类型。
- [ ] `create` 的 id 为必填参数；重复 id 报 `error: id already exists: <id>`。
- [ ] 可选 `fill`/`stroke` 省略时，不生成相应属性。
- [ ] `create ... in <containerId>` 可把新图形直接挂入已存在的 `g`。
- [ ] `in` 目标不存在或不是容器时，分别返回规定错误。
- [ ] 非法数字、缺失参数、多余参数和非正 `scale` 因子均失败，且状态与 undo/redo 栈不变。
- [ ] 未注册类型报 `error: unknown shape type: <type> (is the plugin loaded?)`。
- [ ] `create box` 在 Phase 1 报未注册类型，不提前实现插件。
- [ ] `set` 支持公共外观属性和各类型白名单几何属性；`text` 额外支持文本内容。
- [ ] 白名单外属性报 `error: unknown attribute: <attr>`。

## 4. Composite 与层级编辑

- [ ] `delete` 删除叶子；删除容器时一并删除全部子孙。
- [ ] `move` 平移叶子；平移容器时所有子孙保持相对关系。
- [ ] `scale` 同乘全部几何位置和尺寸；容器操作递归到所有子孙。
- [ ] `group <newGid> <id...>` 保持被收编图形的相对顺序，并作为单个 undo 单元。
- [ ] `ungroup <gid>` 把子项按原顺序提升到父级并占据原位置。
- [ ] 根级容器拒绝 ungroup，复合图形（未来插件）拒绝 ungroup。
- [ ] `addto <gid> <id>` 把已有图形移到容器末尾，并拒绝自包含/循环层级。
- [ ] `front`/`back` 只调整同一父容器中的顺序。
- [ ] 容器和叶子的属性修改、删除、显示走统一多态接口，不依赖外部类型判断。

## 5. Command、撤销与重做

- [ ] 每个成功的编辑命令恰好形成一个 undo 单元。
- [ ] 失败命令不修改文档、不写入历史、不清空 redo 栈。
- [ ] `undo` 恢复上一编辑，`redo` 恢复被撤销编辑。
- [ ] `group`、`ungroup`、递归 `move`/`scale` 均可一次完整撤销和重做。
- [ ] 显示命令 `tree`、`show`、`help` 不进入历史。
- [ ] undo 后的新编辑清空 redo 栈。
- [ ] IO 类命令后 undo/redo 报 `error: undo not allowed after io command`。
- [ ] IO 后首个成功编辑重新启用历史，同时不会允许跨越 IO 撤销旧状态。

## 6. 显示与 CLI

- [ ] REPL 提示符为 `svg>`，逐行执行，空行忽略，`#` 开头行作为注释忽略。
- [ ] 双引号参数可包含空格，文本内容可用 `\"` 转义。
- [ ] `tree [id]` 默认显示整个文档，指定 id 时只显示其子树。
- [ ] `tree` 内联关键几何属性，并正确绘制层级连接线。
- [ ] `show <id>` 显示类型、id、父容器和属性明细。
- [ ] `help` 显示全部命令及语法。
- [ ] 成功编辑命令返回结果摘要；错误统一以 `error:` 开头且一行一条。

## 7. SVG 读写一致性

- [ ] 输出包含 XML 声明、SVG 命名空间、宽高和 `viewBox`。
- [ ] 图形层级映射为 `<g>` 嵌套，叶子的标签和属性符合 SVG。
- [ ] `text` 内容序列化为元素文本，而非属性。
- [ ] 读入后保存再读入，文档语义保持一致，允许可比较的规范化文本差异。
- [ ] 读入时自动补 id 的警告可观察，且补出的 id 满足全文档唯一性。
- [ ] 非法 SVG、缺失/非法画布尺寸和重复 id 的导入策略明确并经过测试。

## 8. 典型序列与质量门槛

- [ ] 课程第 6 节完整 transcript 中的有效命令序列可回放。
- [ ] 课程 6.1 两节点流程图序列生成预期层级和几何结果。
- [ ] 重点覆盖 id 唯一性、非法参数原子性、group/ungroup、递归变换、undo/redo、IO 屏障和 round-trip。
- [ ] `npm run build` 通过。
- [ ] `npm test` 全部通过。
- [ ] `npm run cli` 可启动且不泄漏未处理异常。
- [ ] README 一致性自查基于最终代码，不虚构测试与提交记录。
- [ ] 验收完成后再创建 `final` tag；远程未配置时明确报告，不声称已推送。

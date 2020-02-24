import Deliveryman from '../models/Deliveryman';

class DeliverymanController {
  async store(req, res) {
    const checkDeliverymanExists = await Deliveryman.findOne({
      where: { email: req.body.email },
    });

    if (checkDeliverymanExists) {
      return res
        .status(400)
        .json({ error: 'The email address is already in use' });
    }

    const deliveryman = await Deliveryman.create({
      name: req.body.name,
      email: req.body.email,
    });

    return res.json(deliveryman);
  }
}

export default new DeliverymanController();
